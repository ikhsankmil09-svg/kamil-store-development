'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FormMessage, SubmitButton, nativeSelectClass } from '@/components/form-bits'
import { ProductImage } from '@/components/product-image'
import { saveProduct } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product } from '@/lib/types'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function ProductForm({
  product,
  categories,
  onDone,
}: {
  product?: Product
  categories: Category[]
  onDone: () => void
}) {
  const router = useRouter()
  const [state, action] = useActionState(saveProduct, undefined)
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      router.refresh()
      onDoneRef.current()
    }
  }, [state, router])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setUploadError(undefined)
    if (!ALLOWED.includes(file.type)) return setUploadError('Format gambar harus JPG, PNG, WEBP, atau GIF.')
    if (file.size > MAX_SIZE) return setUploadError('Ukuran gambar maksimal 2 MB.')

    setUploading(true)
    const supabase = createClient()
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type })
    if (error) {
      setUploadError('Gagal mengunggah gambar. Pastikan Anda login sebagai Admin.')
    } else {
      setImageUrl(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />
      <FormMessage state={state} />

      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0">
          <ProductImage src={imageUrl} alt="Pratinjau gambar produk" className="rounded-xl border" />
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            id="image_file"
            type="file"
            accept={ALLOWED.join(',')}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
              {uploading ? 'Mengunggah...' : imageUrl ? 'Ganti gambar' : 'Unggah gambar'}
            </Button>
            {imageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl('')}>
                <X aria-hidden="true" /> Hapus
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF. Maks 2 MB.</p>
          {uploadError && (
            <p role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      <Field label="Nama produk" htmlFor="name">
        <Input id="name" name="name" defaultValue={product?.name} required maxLength={150} className="h-10" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Harga (Rp)" htmlFor="price">
          <Input id="price" name="price" type="number" inputMode="numeric" min={0} step={100} defaultValue={product?.price ?? ''} required className="h-10" />
        </Field>
        <Field label="Stok" htmlFor="stock">
          <Input id="stock" name="stock" type="number" inputMode="numeric" min={0} step={1} defaultValue={product?.stock ?? 0} required className="h-10" />
        </Field>
      </div>
      <Field label="Kategori" htmlFor="category_id">
        <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ''} className={`${nativeSelectClass} h-10`}>
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Deskripsi" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={product?.description} maxLength={2000} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4 accent-primary" />
        Tampilkan di katalog
      </label>
      <SubmitButton pendingText="Menyimpan..." className="h-11 w-full">
        {product ? 'Simpan perubahan' : 'Tambah produk'}
      </SubmitButton>
    </form>
  )
}

export function ProductFormDialog({ product, categories }: { product?: Product; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {product ? (
        <Button variant="outline" size="icon" aria-label={`Edit ${product.name}`} onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" /> Tambah produk
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{product ? 'Edit produk' : 'Tambah produk'}</DialogTitle>
            <DialogDescription>Data produk akan langsung tampil di katalog jika diaktifkan.</DialogDescription>
          </DialogHeader>
          <ProductForm product={product} categories={categories} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
