-- KAMIL STORE: skema, fungsi, RLS, dan storage. Jalankan pertama (sebelum 003_cart_items.sql).
begin;

-- =========================== TABLES ===========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create unique index categories_name_key on public.categories (lower(btrim(name)));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 150),
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_created_at_idx on public.products (created_at desc);
create index products_active_idx on public.products (is_active);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending','processing','shipped','completed','cancelled')),
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  subtotal numeric(14,2) generated always as (quantity * price) stored
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- =========================== HELPERS ===========================
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- Profil otomatis dibuat saat register. Role SELALU ditentukan server,
-- tidak pernah dari input user. Akun pertama (saat belum ada admin) menjadi admin.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_role text := 'user';
begin
  perform pg_advisory_xact_lock(hashtext('kamil_store_first_admin'));
  if not exists (select 1 from public.profiles where role = 'admin') then
    v_role := 'admin';
  end if;
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    v_role
  ) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stok dikembalikan saat pesanan dibatalkan; pesanan batal tidak bisa dibuka lagi.
create function public.orders_status_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'cancelled' then
      raise exception 'Pesanan yang sudah dibatalkan tidak dapat diubah lagi.';
    end if;
    if new.status = 'cancelled' then
      update public.products p
         set stock = p.stock + oi.quantity
        from public.order_items oi
       where oi.order_id = new.id and oi.product_id = p.id;
    end if;
  end if;
  return new;
end $$;

create trigger orders_status_guard_trg before update on public.orders
  for each row execute function public.orders_status_guard();

-- =========================== RPC ===========================
create function public.create_order(
  p_items jsonb,
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_address text,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_total numeric(14,2) := 0;
  r record;
  v_product public.products%rowtype;
begin
  if v_uid is null then raise exception 'Silakan login terlebih dahulu.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong.';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Terlalu banyak item dalam satu pesanan.'; end if;
  if char_length(btrim(coalesce(p_shipping_name, ''))) < 2 then raise exception 'Nama penerima wajib diisi.'; end if;
  if char_length(btrim(coalesce(p_shipping_phone, ''))) not between 8 and 20 then raise exception 'Nomor telepon harus 8-20 karakter.'; end if;
  if char_length(btrim(coalesce(p_shipping_address, ''))) < 10 then raise exception 'Alamat pengiriman minimal 10 karakter.'; end if;

  insert into public.orders (user_id, shipping_name, shipping_phone, shipping_address, notes)
  values (v_uid, btrim(p_shipping_name), btrim(p_shipping_phone), btrim(p_shipping_address), nullif(btrim(coalesce(p_notes, '')), ''))
  returning id into v_order_id;

  for r in
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::int) as qty
    from jsonb_array_elements(p_items) e
    group by 1 order by 1
  loop
    if r.qty < 1 or r.qty > 100 then raise exception 'Jumlah barang harus antara 1 dan 100.'; end if;

    select * into v_product from public.products where id = r.product_id and is_active for update;
    if not found then raise exception 'Ada produk yang sudah tidak tersedia. Silakan perbarui keranjang.'; end if;
    if v_product.stock < r.qty then
      raise exception 'Stok "%" tidak cukup (tersisa %).', v_product.name, v_product.stock;
    end if;

    update public.products set stock = stock - r.qty where id = v_product.id;
    insert into public.order_items (order_id, product_id, product_name, quantity, price)
    values (v_order_id, v_product.id, v_product.name, r.qty, v_product.price);
    v_total := v_total + v_product.price * r.qty;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;
  return v_order_id;
end $$;

create function public.cancel_my_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Pesanan tidak dapat dibatalkan. Hanya pesanan berstatus menunggu yang bisa dibatalkan.';
  end if;
end $$;

create function public.admin_set_user_role(p_user_id uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak.' using errcode = '42501'; end if;
  if p_role not in ('admin','user') then raise exception 'Role tidak valid.'; end if;
  if p_user_id = auth.uid() then raise exception 'Anda tidak dapat mengubah role akun Anda sendiri.'; end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then raise exception 'Pengguna tidak ditemukan.'; end if;
end $$;

create function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'total_products', (select count(*) from public.products),
    'total_orders', (select count(*) from public.orders),
    'total_users', (select count(*) from public.profiles),
    'total_revenue', (select coalesce(sum(total_amount), 0) from public.orders where status <> 'cancelled'),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'low_stock', (select count(*) from public.products where stock <= 5)
  );
end $$;

create function public.admin_top_products(p_limit int default 5)
returns table (product_id uuid, product_name text, total_qty bigint, total_revenue numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak.' using errcode = '42501'; end if;
  return query
    select oi.product_id, oi.product_name, sum(oi.quantity)::bigint, sum(oi.subtotal)
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where o.status <> 'cancelled'
     group by oi.product_id, oi.product_name
     order by sum(oi.quantity) desc, sum(oi.subtotal) desc
     limit greatest(least(coalesce(p_limit, 5), 50), 1);
end $$;

create function public.admin_sales_report(p_days int default 30)
returns table (day date, orders_count bigint, revenue numeric)
language plpgsql stable security definer set search_path = '' as $$
declare v_days int := greatest(least(coalesce(p_days, 30), 365), 1);
begin
  if not public.is_admin() then raise exception 'Akses ditolak.' using errcode = '42501'; end if;
  return query
    select d::date,
           count(o.id)::bigint,
           coalesce(sum(o.total_amount), 0)
      from generate_series(
             ((now() at time zone 'Asia/Jakarta')::date - (v_days - 1)),
             (now() at time zone 'Asia/Jakarta')::date,
             interval '1 day') d
      left join public.orders o
        on (o.created_at at time zone 'Asia/Jakarta')::date = d::date
       and o.status <> 'cancelled'
     group by d
     order by d;
end $$;

-- =========================== GRANTS ===========================
revoke all on public.profiles, public.categories, public.products, public.orders, public.order_items from anon, authenticated;

grant select on public.categories, public.products to anon;
grant select on public.profiles, public.categories, public.orders, public.order_items to authenticated;
grant select on public.products to authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant update (status) on public.orders to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.create_order(jsonb, text, text, text, text) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_top_products(int) to authenticated;
grant execute on function public.admin_sales_report(int) to authenticated;

-- =========================== RLS ===========================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: baca milik sendiri / admin; ubah hanya full_name milik sendiri (kolom role tidak di-grant)
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- categories
create policy categories_select_anon on public.categories for select to anon using (true);
create policy categories_select_auth on public.categories for select to authenticated using (true);
create policy categories_insert_admin on public.categories for insert to authenticated with check (public.is_admin());
create policy categories_update_admin on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_delete_admin on public.categories for delete to authenticated using (public.is_admin());

-- products
create policy products_select_anon on public.products for select to anon using (is_active);
create policy products_select_auth on public.products for select to authenticated using (is_active or public.is_admin());
create policy products_insert_admin on public.products for insert to authenticated with check (public.is_admin());
create policy products_update_admin on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_delete_admin on public.products for delete to authenticated using (public.is_admin());

-- orders (insert hanya lewat RPC create_order)
create policy orders_select on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy orders_update_admin on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- order_items
create policy order_items_select on public.order_items for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- =========================== STORAGE ===========================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "product_images_insert_admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_update_admin" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_delete_admin" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

commit;
