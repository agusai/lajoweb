'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Plus, Edit, Motorbike } from 'lucide-react'
import { toast } from 'sonner'
import { addMotorcycle, updateMotorcycle, updateMotorcycleStatus } from './actions'
import type { MotorcycleRow } from './page'

const STATUS_OPTIONS = ['available', 'rented', 'maintenance', 'inactive'] as const

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'available': return 'default'
    case 'rented': return 'secondary'
    case 'maintenance': return 'outline'
    case 'inactive': return 'destructive'
    default: return 'secondary'
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
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Add Motorcycle
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {motorcycles.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Motorbike className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">{m.model}</CardTitle>
                </div>
                <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Plate</span>
                <span className="font-medium">{m.plate_number}</span>
                <span className="text-muted-foreground">Color</span>
                <span>{m.color ?? '—'}</span>
                <span className="text-muted-foreground">Year</span>
                <span>{m.year ?? '—'}</span>
                <span className="text-muted-foreground">Daily Rate</span>
                <span className="font-medium">RM {m.daily_price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(m)}
                  className="flex-1 gap-1.5"
                >
                  <Edit className="size-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={m.status === 'available' ? 'secondary' : 'default'}
                  onClick={() => handleToggle(m.id, m.status)}
                  disabled={isPending || m.status === 'rented'}
                  className="flex-1"
                >
                  {m.status === 'available' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {motorcycles.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">
            No motorcycles yet. Add your first one!
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Motorcycle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="add-model">Model *</Label>
                <Input id="add-model" name="model" required placeholder="Honda PCX 150" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-plate">Plate Number *</Label>
                <Input id="add-plate" name="plate_number" required placeholder="JSA 1234" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-color">Color</Label>
                <Input id="add-color" name="color" placeholder="White" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-year">Year</Label>
                <Input id="add-year" name="year" type="number" placeholder="2023" min="1990" max="2030" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-price">Daily Price (RM) *</Label>
                <Input
                  id="add-price"
                  name="daily_price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="50.00"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="add-status">Status</Label>
                <select
                  id="add-status"
                  name="status"
                  defaultValue="available"
                  className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding…' : 'Add Motorcycle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <Sheet open={!!editMoto} onOpenChange={(o) => !o && setEditMoto(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Motorcycle</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label>Model</Label>
              <Input
                value={editForm.model}
                onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Plate Number</Label>
              <Input
                value={editForm.plate_number}
                onChange={(e) => setEditForm((f) => ({ ...f, plate_number: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <Input
                value={editForm.color}
                onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={editForm.year}
                onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Daily Price (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.daily_price}
                onChange={(e) => setEditForm((f) => ({ ...f, daily_price: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditMoto(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
