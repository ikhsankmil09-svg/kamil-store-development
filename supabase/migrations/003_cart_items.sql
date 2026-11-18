begin;

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index cart_items_user_id_idx on public.cart_items (user_id);
create index cart_items_product_id_idx on public.cart_items (product_id);

alter table public.cart_items enable row level security;
revoke all on public.cart_items from anon, authenticated;
grant select, insert, delete on public.cart_items to authenticated;
grant update (quantity) on public.cart_items to authenticated;

create policy cart_select_own on public.cart_items for select to authenticated using (user_id = auth.uid());
create policy cart_insert_own on public.cart_items for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );
create policy cart_update_own on public.cart_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_delete_own on public.cart_items for delete to authenticated using (user_id = auth.uid());

create or replace function public.create_order(
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
  delete from public.cart_items where user_id = v_uid;
  return v_order_id;
end $$;

revoke execute on function public.create_order(jsonb, text, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text) to authenticated;

commit;
