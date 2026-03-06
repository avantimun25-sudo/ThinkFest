import { useState } from "react";
import { useCreateList } from "@/hooks/use-lists";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b"];

export function CreateListDialog({ open, onOpenChange }: CreateListDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const createList = useCreateList();

  const handleCreate = () => {
    if (!name.trim()) return;
    createList.mutate({ name, color }, {
      onSuccess: () => {
        setName("");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-display font-bold">Create New List</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground font-semibold">List Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Work, Personal, Groceries"
              className="py-6 bg-accent/20 border-border/50 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-muted-foreground font-semibold">List Color</Label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-foreground' : 'opacity-80'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createList.isPending} className="rounded-xl px-6">
            {createList.isPending ? "Creating..." : "Create List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
