'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FormMessage, SubmitButton } from '@/components/form-bits'
import { saveCategory } from '@/lib/actions/admin'
import type { Category } from '@/lib/types'

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const router = useRouter()
  const [state, action] = useActionState(saveCategory, undefined)

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

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormMessage state={state} />
      <Field label="Nama kategori" htmlFor="category-name">
        <Input id="category-name" name="name" defaultValue={category?.name} required maxLength={80} className="h-10" />
      </Field>
      <SubmitButton pendingText="Menyimpan..." className="h-11 w-full">
        {category ? 'Simpan perubahan' : 'Tambah kategori'}
      </SubmitButton>
    </form>
  )
}

export function CategoryFormDialog({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {category ? (
        <Button variant="outline" size="icon" aria-label={`Edit ${category.name}`} onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" /> Tambah kategori
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{category ? 'Edit kategori' : 'Tambah kategori'}</DialogTitle>
            <DialogDescription>Kategori digunakan untuk mengelompokkan dan memfilter produk.</DialogDescription>
          </DialogHeader>
          <CategoryForm category={category} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
