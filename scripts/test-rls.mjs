// Uji keamanan RLS KAMIL STORE. Seluruh pengujian berjalan dalam satu transaksi
// yang SELALU di-rollback, sehingga tidak meninggalkan data apa pun.
// Jalankan: POSTGRES_URL_NON_POOLING="..." node scripts/test-rls.mjs
import pg from 'pg'

// sslmode di URL menimpa opsi ssl, jadi dibuang agar rejectUnauthorized:false berlaku (sertifikat pooler Supabase self-signed)
const connectionString = (process.env.POSTGRES_URL_NON_POOLING ?? '').replace(/[?&]sslmode=[^&]*/g, '')
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()

const ADMIN = '00000000-0000-4000-8000-000000000001'
const U1 = '00000000-0000-4000-8000-000000000002'
const U2 = '00000000-0000-4000-8000-000000000003'

let pass = 0
let fail = 0
const report = (name, ok, detail = '') => {
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`)
}

const as = async (who) => {
  await client.query('reset role')
  if (who === 'anon') {
    await client.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true), set_config('request.jwt.claim.sub', '', true)`)
    await client.query('set local role anon')
    return
  }
  const claims = JSON.stringify({ sub: who, role: 'authenticated' })
  await client.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [claims, who])
  await client.query('set local role authenticated')
}

const expectDenied = async (name, sql, params = []) => {
  await client.query('savepoint sp')
  try {
    const r = await client.query(sql, params)
    await client.query('rollback to savepoint sp')
    report(name, r.rowCount === 0, r.rowCount === 0 ? 'ditolak (0 baris terpengaruh)' : `BOCOR: ${r.rowCount} baris`)
  } catch (e) {
    await client.query('rollback to savepoint sp')
    report(name, true, `ditolak: ${e.message.slice(0, 70)}`)
  }
}

const expectOk = async (name, sql, params = []) => {
  await client.query('savepoint sp')
  try {
    const r = await client.query(sql, params)
    await client.query('release savepoint sp')
    report(name, true, `${r.rowCount ?? 0} baris`)
    return r
  } catch (e) {
    await client.query('rollback to savepoint sp')
    report(name, false, e.message.slice(0, 90))
  }
}

try {
  await client.query('begin')

  const existing = (await client.query(`select count(*)::int c from public.profiles where role = 'admin'`)).rows[0].c
  if (existing > 0) console.log(`Catatan: sudah ada ${existing} admin; tes trigger "akun pertama = admin" dilewati.\n`)

  for (const [id, email] of [[ADMIN, 'admin-test@kamil.test'], [U1, 'user1-test@kamil.test'], [U2, 'user2-test@kamil.test']]) {
    await client.query(
      `insert into auth.users (id, email, aud, role, raw_user_meta_data, instance_id) values ($1, $2, 'authenticated', 'authenticated', '{"full_name":"Uji"}', '00000000-0000-0000-0000-000000000000')`,
      [id, email],
    )
  }
  if (existing === 0) {
    const roles = (await client.query(`select id, role from public.profiles where id in ($1,$2,$3)`, [ADMIN, U1, U2])).rows
    report('Trigger: akun pertama = admin, berikutnya = user', roles.find((r) => r.id === ADMIN)?.role === 'admin' && roles.filter((r) => r.role === 'user').length === 2)
  } else {
    await client.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN])
  }

  await as(ADMIN)
  const cat = (await expectOk('ADMIN dapat INSERT kategori', `insert into categories(name) values ('Uji') returning id`))?.rows[0]
  const prod = (await expectOk('ADMIN dapat INSERT produk', `insert into products(name, price, stock, category_id) values ('Produk Uji', 10000, 5, $1) returning id`, [cat.id]))?.rows[0]
  await expectOk('ADMIN dapat UPDATE produk', `update products set price = 12000 where id = $1`, [prod.id])

  await as(U1)
  await expectOk('USER dapat membaca produk', `select id from products where id = $1`, [prod.id])
  await expectDenied('USER tidak dapat INSERT produk', `insert into products(name, price, stock) values ('Hack', 1, 1)`)
  await expectDenied('USER tidak dapat UPDATE harga produk', `update products set price = 1 where id = $1`, [prod.id])
  await expectDenied('USER tidak dapat UPDATE stok produk', `update products set stock = 9999 where id = $1`, [prod.id])
  await expectDenied('USER tidak dapat DELETE produk', `delete from products where id = $1`, [prod.id])
  await expectDenied('USER tidak dapat INSERT kategori', `insert into categories(name) values ('Hack')`)
  await expectDenied('USER tidak dapat mengubah role sendiri menjadi admin', `update profiles set role = 'admin' where id = $1`, [U1])
  await expectDenied('USER tidak dapat mengubah email di profil', `update profiles set email = 'x@x.com' where id = $1`, [U1])
  await expectOk('USER dapat mengubah full_name sendiri', `update profiles set full_name = 'Nama Baru' where id = $1`, [U1])
  await expectDenied('USER tidak dapat INSERT profil admin langsung', `insert into profiles(id, email, role) values (gen_random_uuid(), 'a@a.com', 'admin')`)
  await expectDenied('USER tidak dapat memanggil admin_set_user_role', `select admin_set_user_role($1, 'admin')`, [U2])
  await expectDenied('USER tidak dapat memanggil admin_dashboard_stats', `select admin_dashboard_stats()`)
  await expectDenied('USER tidak dapat memanggil admin_sales_report', `select * from admin_sales_report(7)`)
  await expectDenied('USER tidak dapat memanggil admin_top_products', `select * from admin_top_products(5)`)
  await expectDenied('USER tidak dapat INSERT order langsung (harus via RPC)', `insert into orders(user_id, shipping_name, shipping_phone, shipping_address) values ($1,'a','12345678','alamat panjang sekali')`, [U1])
  await expectDenied('USER tidak dapat upload gambar produk ke storage', `insert into storage.objects(bucket_id, name, owner) values ('product-images', 'hack.png', $1)`, [U1])

  await expectDenied('Checkout ditolak jika melebihi stok', `select create_order($1::jsonb, 'Budi', '081234567890', 'Jl. Contoh No. 1, Jakarta', null)`, [JSON.stringify([{ product_id: prod.id, quantity: 6 }])])
  await expectDenied('Checkout ditolak jika keranjang kosong', `select create_order('[]'::jsonb, 'Budi', '081234567890', 'Jl. Contoh No. 1, Jakarta', null)`)
  await expectDenied('Checkout ditolak jika jumlah negatif', `select create_order($1::jsonb, 'Budi', '081234567890', 'Jl. Contoh No. 1, Jakarta', null)`, [JSON.stringify([{ product_id: prod.id, quantity: -1 }])])
  const ord = (await expectOk('USER dapat checkout via RPC', `select create_order($1::jsonb, 'Budi', '081234567890', 'Jl. Contoh No. 1, Jakarta', null) as id`, [JSON.stringify([{ product_id: prod.id, quantity: 2 }, { product_id: prod.id, quantity: 1 }])]))?.rows[0]
  const o = (await client.query(`select total_amount, status, user_id from orders where id = $1`, [ord.id])).rows[0]
  report('Total dihitung server (3 x 12000 = 36000, harga dari DB)', Number(o.total_amount) === 36000 && o.user_id === U1, `total=${o.total_amount}`)
  await expectOk('USER melihat order miliknya', `select id from orders where id = $1`, [ord.id])
  await expectOk('USER melihat order_items miliknya', `select id from order_items where order_id = $1`, [ord.id])
  await expectDenied('USER tidak dapat mengubah status order sendiri', `update orders set status = 'completed' where id = $1`, [ord.id])
  await expectDenied('USER tidak dapat mengubah total order', `update orders set total_amount = 1 where id = $1`, [ord.id])
  await expectDenied('USER tidak dapat mengubah order_items', `update order_items set price = 1 where order_id = $1`, [ord.id])
  await expectDenied('USER tidak dapat DELETE order_items', `delete from order_items where order_id = $1`, [ord.id])
  await expectOk('USER dapat menambah keranjang', `insert into cart_items(user_id, product_id, quantity) values ($1, $2, 1)`, [U1, prod.id])

  await as(U2)
  const seen = (await client.query(`select id from orders`)).rows.length
  report('USER lain TIDAK melihat order user lain', seen === 0, `terlihat ${seen} order`)
  const seenItems = (await client.query(`select id from order_items`)).rows.length
  report('USER lain TIDAK melihat order_items user lain', seenItems === 0, `terlihat ${seenItems} item`)
  const seenProfiles = (await client.query(`select id from profiles`)).rows
  report('USER hanya melihat profil sendiri', seenProfiles.length === 1 && seenProfiles[0].id === U2, `terlihat ${seenProfiles.length} profil`)
  const seenCart = (await client.query(`select id from cart_items`)).rows.length
  report('USER lain TIDAK melihat keranjang user lain', seenCart === 0, `terlihat ${seenCart}`)
  await expectDenied('USER lain tidak dapat membatalkan order user lain', `select cancel_my_order($1)`, [ord.id])
  await expectDenied('USER lain tidak dapat mengisi keranjang atas nama user lain', `insert into cart_items(user_id, product_id, quantity) values ($1, $2, 1)`, [U1, prod.id])

  await as('anon')
  await expectOk('ANON dapat membaca produk aktif', `select id from products where id = $1`, [prod.id])
  await expectDenied('ANON tidak dapat membaca orders', `select id from orders`)
  await expectDenied('ANON tidak dapat membaca profiles', `select id from profiles`)
  await expectDenied('ANON tidak dapat INSERT produk', `insert into products(name, price, stock) values ('Hack', 1, 1)`)
  await expectDenied('ANON tidak dapat memanggil create_order', `select create_order('[]'::jsonb,'a','12345678','alamat panjang sekali')`)

  await as(ADMIN)
  const allOrders = (await client.query(`select id from orders`)).rows.length
  report('ADMIN melihat semua order', allOrders >= 1, `${allOrders} order`)
  await expectOk('ADMIN dapat mengubah status order', `update orders set status = 'processing' where id = $1`, [ord.id])
  const stats = (await expectOk('ADMIN dapat membaca statistik', `select admin_dashboard_stats() as s`))?.rows[0]
  report('Statistik dashboard terbaca', typeof stats?.s?.total_users === 'number', JSON.stringify(stats?.s))
  await expectOk('ADMIN dapat membaca laporan penjualan', `select * from admin_sales_report(7)`)
  await expectOk('ADMIN dapat membaca produk terlaris', `select * from admin_top_products(5)`)
  await expectOk('ADMIN dapat mengubah role user', `select admin_set_user_role($1, 'admin')`, [U2])
  await expectDenied('ADMIN tidak dapat mengubah role akun sendiri', `select admin_set_user_role($1, 'user')`, [ADMIN])
  await expectOk('ADMIN dapat upload ke storage', `insert into storage.objects(bucket_id, name, owner) values ('product-images', 'ok.png', $1)`, [ADMIN])

  const stock1 = (await client.query(`select stock from products where id = $1`, [prod.id])).rows[0].stock
  report('Stok berkurang setelah order (5 - 3 = 2)', stock1 === 2, `stok=${stock1}`)
  await expectOk('ADMIN membatalkan order', `update orders set status = 'cancelled' where id = $1`, [ord.id])
  const stock2 = (await client.query(`select stock from products where id = $1`, [prod.id])).rows[0].stock
  report('Stok dikembalikan saat order dibatalkan (kembali 5)', stock2 === 5, `stok=${stock2}`)
  await expectDenied('Order batal tidak dapat dibuka kembali', `update orders set status = 'pending' where id = $1`, [ord.id])
  await expectOk('ADMIN dapat DELETE produk', `delete from products where id = $1`, [prod.id])
  const kept = (await client.query(`select count(*)::int c from order_items where order_id = $1 and product_name = 'Produk Uji'`, [ord.id])).rows[0].c
  report('Riwayat order tetap ada setelah produk dihapus', kept === 1)
} catch (e) {
  console.error('ERROR TEST:', e.message)
  fail++
} finally {
  await client.query('reset role').catch(() => {})
  await client.query('rollback').catch(() => {})
  const left = (await client.query(`select count(*)::int c from auth.users where email like '%-test@kamil.test'`)).rows[0].c
  console.log(`\nRollback selesai. Data uji tersisa: ${left}`)
  console.log(`HASIL: ${pass} lulus, ${fail} gagal`)
  await client.end()
}
