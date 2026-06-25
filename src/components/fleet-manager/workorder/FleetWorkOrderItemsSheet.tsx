import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';
import {
  fleetWorkOrderItemSchema,
  type fleetWorkOrderItemFormValues,
  type FleetWorkOrderItemFormInput,
} from '@/lib/fleet-manager/validators';
import type { FleetWorkOrder, FleetWorkOrderItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

type Props = {
  workOrder: FleetWorkOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptyDefaults: FleetWorkOrderItemFormInput = {
  itemName: '',
  itemPrice: '',
  itemNumber: '',
  hsnNo: '',
};

export function FleetWorkOrderItemsSheet({
  workOrder,
  open,
  onOpenChange,
}: Props) {
  const [lineItems, setLineItems] = useState<FleetWorkOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FleetWorkOrderItem | null>(
    null,
  );
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadItems = useCallback(async () => {
    if (!workOrder) return;
    setLoadingItems(true);
    try {
      const list = await fleetWorkOrderService.getItemsByWorkOrderId(
        workOrder.id,
      );
      setLineItems(list);
    } catch {
      toast.error('Could not load items');
      setLineItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [workOrder]);

  useEffect(() => {
    if (open && workOrder) void loadItems();
    if (!open) {
      setItemDialogOpen(false);
      setEditingItem(null);
      setDeleteItemId(null);
    }
  }, [open, workOrder, loadItems]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    FleetWorkOrderItemFormInput,
    unknown,
    fleetWorkOrderItemFormValues
  >({
    resolver: zodResolver(fleetWorkOrderItemSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!itemDialogOpen) return;
    if (editingItem) {
      reset({
        itemName: editingItem.itemName,
        itemPrice: String(editingItem.itemPrice),
        itemNumber: String(editingItem.itemNumber),
        hsnNo: editingItem.hsnNo ?? '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [itemDialogOpen, editingItem, reset]);

  const openAdd = () => {
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const openEdit = (item: FleetWorkOrderItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const onSubmitItem = async (data: fleetWorkOrderItemFormValues) => {
    if (!workOrder) return;
    setBusy(true);
    try {
      if (editingItem) {
        await fleetWorkOrderService.updateFleetWorkOrderItem(
          editingItem.id,
          data,
        );
        toast.success('Item updated');
      } else {
        await fleetWorkOrderService.addFleetWorkOrderItem(workOrder.id, data);
        toast.success('Item added');
      }
      setItemDialogOpen(false);
      setEditingItem(null);
      await loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    setBusy(true);
    try {
      await fleetWorkOrderService.deleteFleetWorkOrderItem(deleteItemId);
      toast.success('Item deleted');
      setDeleteItemId(null);
      await loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  if (!workOrder) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side='right'
          className='flex w-full flex-col gap-0 overflow-hidden sm:max-w-2xl'
        >
          <SheetHeader className='border-b pb-4'>
            <SheetTitle>Line items — {workOrder.workOrderNumber}</SheetTitle>
            <SheetDescription>
              Add, edit, or remove items for this work order.
            </SheetDescription>
          </SheetHeader>

          <div className='flex flex-1 flex-col gap-4 overflow-hidden p-4'>
            <div className='flex shrink-0 justify-end'>
              <Button type='button' size='sm' onClick={openAdd}>
                <Plus className='h-4 w-4' />
                Add item
              </Button>
            </div>

            <div className='min-h-0 flex-1 overflow-auto rounded-md border'>
              {loadingItems ? (
                <div className='flex items-center justify-center gap-2 p-8 text-muted-foreground'>
                  <Loader2 className='h-5 w-5 animate-spin' />
                  Loading items…
                </div>
              ) : lineItems.length === 0 ? (
                <p className='p-8 text-center text-sm text-muted-foreground'>
                  No line items yet. Use &quot;Add item&quot; to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item name</TableHead>
                      <TableHead>HSN</TableHead>
                      <TableHead className='text-right'>Price (₹)</TableHead>
                      <TableHead className='text-right'>Item #</TableHead>
                      <TableHead className='w-[100px] text-right'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.hsnNo ?? '—'}</TableCell>
                        <TableCell className='text-right'>
                          ₹{Number(item.itemPrice).toLocaleString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.itemNumber}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-0.5'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              className='shrink-0'
                              aria-label='Edit item'
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              className='shrink-0 text-destructive hover:text-destructive'
                              aria-label='Delete item'
                              onClick={() => setDeleteItemId(item.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={itemDialogOpen}
        onOpenChange={(o) => {
          setItemDialogOpen(o);
          if (!o) setEditingItem(null);
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit line item' : 'Add line item'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmitItem)}
            className='space-y-4 pt-2'
          >
            <div className='space-y-2'>
              <Label htmlFor='fleet-item-name'>Item name *</Label>
              <Input id='fleet-item-name' {...register('itemName')} />
              {errors.itemName && (
                <p className='text-sm text-destructive'>
                  {String(errors.itemName.message)}
                </p>
              )}
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='fleet-hsn'>HSN *</Label>
                <Input id='fleet-hsn' {...register('hsnNo')} />
                {errors.hsnNo && (
                  <p className='text-sm text-destructive'>
                    {String(errors.hsnNo.message)}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='fleet-item-num'>Item No.*</Label>
                <Input
                  id='fleet-item-num'
                  type='text'
                  inputMode='numeric'
                  {...register('itemNumber')}
                />
                {errors.itemNumber && (
                  <p className='text-sm text-destructive'>
                    {String(errors.itemNumber.message)}
                  </p>
                )}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='fleet-price'>Price (₹) *</Label>
              <Input
                id='fleet-price'
                type='text'
                inputMode='decimal'
                {...register('itemPrice')}
              />
              {errors.itemPrice && (
                <p className='text-sm text-destructive'>
                  {String(errors.itemPrice.message)}
                </p>
              )}
            </div>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setItemDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting || busy}>
                {(isSubmitting || busy) && (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )}
                {editingItem ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteItemId}
        onClose={() => !busy && setDeleteItemId(null)}
        onConfirm={confirmDeleteItem}
        loading={busy}
        title='Delete this line item?'
        description='This removes only this item from the work order.'
      />
    </>
  );
}
