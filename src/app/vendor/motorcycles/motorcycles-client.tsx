'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Plus, Edit, Motorbike } from 'lucide-react'
import { toast } from 'sonner'
import { addMotorcycle, updateMotorcycle, updateMotorcycleStatus } from './actions'
import type { MotorcycleRow } from './page'

const STATUS_OPTIONS = ['available', 'rented', 'maintenance', 'inactive'] as const

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'available': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'rented': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'maintenance': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    case 'inactive': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
  }
}

export function MotorcyclesClient({ motorcycles }: { motorcycles: MotorcycleRow[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editMoto, setEditMoto] = useState<MotorcycleRow | null>(null)
  const [editForm, setEditForm] = useState({
    model: '',
    plate_number: '',
    color: '',
    year: '',
    daily_price: '',
    status: 'available',
  })
  const [isPending, startTransition] = useTransition()

  function openEdit(m: MotorcycleRow) {
    setEditMoto(m)
    setEditForm({
      model: m.model,
      plate_number: m.plate_number,
      color: m.color ?? '',
      year: m.year ? String(m.year) : '',
      daily_price: String(m.daily_price),
      status: m.status,
    })
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addMotorcycle(fd)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Motorcycle added')
        setAddOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  function handleUpdate() {
    if (!editMoto) return
    startTransition(async () => {
      const result = await updateMotorcycle(editMoto.id, {
        model: editForm.model,
        plate_number: editForm.plate_number,
        color: editForm.color || null,
        year: editForm.year ? Number(editForm.year) : null,
        daily_price: Number(editForm.daily_price),
        status: editForm.status,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Motorcycle updated')
        setEditMoto(null)
      }
    })
  }

  function handleToggle(id: string, current: string) {
    const next = current === 'available' ? 'inactive' : 'available'
    startTransition(async () => {
      const result = await updateMotorcycleStatus(id, next)
      if (result.error) toast.error(result.error)
      else toast.success(`Set to ${next}`)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
        >
          <Plus className="size-4" />
          Add Motorcycle
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {motorcycles.map((m) => (
          <Card key={m.id} className="bg-[#132A4D] border-white/8">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Motorbike className="size-5 text-[#94A3B8]" />
                  <CardTitle className="text-base text-[#F5F7FA]">{m.model}</CardTitle>
                </div>
                <span className={getStatusBadge(m.status)}>{m.status}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-[#94A3B8]">Plate</span>
                <span className="font-medium text-[#F5F7FA]">{m.plate_number}</span>
                <span className="text-[#94A3B8]">Color</span>
                <span className="text-[#F5F7FA]">{m.color ?? '—'}</span>
                <span className="text-[#94A3B8]">Year</span>
                <span className="text-[#F5F7FA]">{m.year ?? '—'}</span>
                <span className="text-[#94A3B8]">Daily Rate</span>
                <span className="font-medium text-[#FF6A00]">RM {m.daily_price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  onClick={() => openEdit(m)}
                  className="flex-1 gap-1.5 bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10 hover:text-[#F5F7FA]"
                >
                  <Edit className="size-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleToggle(m.id, m.status)}
                  disabled={isPending || m.status === 'rented'}
                  className={
                    m.status === 'available'
                      ? 'flex-1 bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                      : 'flex-1 bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                  }
                >
                  {m.status === 'available' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {motorcycles.length === 0 && (
          <div className="col-span-full text-center text-[#94A3B8] py-16">
            No motorcycles yet. Add your first one!
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#132A4D] border-white/8 text-[#F5F7FA]">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">Add New Motorcycle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="add-model" className="text-[#94A3B8]">Model *</Label>
                <Input
                  id="add-model"
                  name="model"
                  required
                  placeholder="Honda PCX 150"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-plate" className="text-[#94A3B8]">Plate Number *</Label>
                <Input
                  id="add-plate"
                  name="plate_number"
                  required
                  placeholder="JSA 1234"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-color" className="text-[#94A3B8]">Color</Label>
                <Input
                  id="add-color"
                  name="color"
                  placeholder="White"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-year" className="text-[#94A3B8]">Year</Label>
                <Input
                  id="add-year"
                  name="year"
                  type="number"
                  placeholder="2023"
                  min="1990"
                  max="2030"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-price" className="text-[#94A3B8]">Daily Price (RM) *</Label>
                <Input
                  id="add-price"
                  name="daily_price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="50.00"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="add-status" className="text-[#94A3B8]">Status</Label>
                <select
                  id="add-status"
                  name="status"
                  defaultValue="available"
                  className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-[#132A4D]">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setAddOpen(false)}
                className="border-white/10 text-[#94A3B8] bg-white/5 hover:bg-white/10 hover:text-[#F5F7FA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#FF6A00] hover:bg-[#e05e00] text-white"
              >
                {isPending ? 'Adding…' : 'Add Motorcycle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={!!editMoto} onOpenChange={(o) => !o && setEditMoto(null)}>
        <SheetContent className="overflow-y-auto bg-[#132A4D] border-white/8">
          <SheetHeader>
            <SheetTitle className="text-[#F5F7FA]">Edit Motorcycle</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Model</Label>
              <Input
                value={editForm.model}
                onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Plate Number</Label>
              <Input
                value={editForm.plate_number}
                onChange={(e) => setEditForm((f) => ({ ...f, plate_number: e.target.value }))}
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Color</Label>
              <Input
                value={editForm.color}
                onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Year</Label>
              <Input
                type="number"
                value={editForm.year}
                onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Daily Price (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.daily_price}
                onChange={(e) => setEditForm((f) => ({ ...f, daily_price: e.target.value }))}
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-[#F5F7FA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#132A4D] border-white/10">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-[#F5F7FA]">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={() => setEditMoto(null)}
              className="border-white/10 text-[#94A3B8] bg-white/5 hover:bg-white/10 hover:text-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isPending}
              className="bg-[#FF6A00] hover:bg-[#e05e00] text-white"
            >
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
