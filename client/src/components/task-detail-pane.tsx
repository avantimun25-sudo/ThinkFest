import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTask, useUpdateTask, useDeleteTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useAssignTag, useRemoveTag } from "@/hooks/use-tasks";
import { useLists } from "@/hooks/use-lists";
import { useTags } from "@/hooks/use-tags";
import { X, Calendar as CalendarIcon, ListTodo, Hash, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskDetailPaneProps {
  taskId: number | null;
  onClose: () => void;
}

export function TaskDetailPane({ taskId, onClose }: TaskDetailPaneProps) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();
  
  const { data: lists } = useLists();
  const { data: allTags } = useTags();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  if (!taskId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-accent/20">
        <ListTodo className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a task</p>
        <p className="text-sm opacity-70">Choose a task from the list to view details</p>
      </div>
    );
  }

  if (isLoading || !task) {
    return (
      <div className="h-full p-8 space-y-6 bg-card">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const handleSaveDetails = () => {
    if (title !== task.title || description !== task.description) {
      updateTask.mutate({ id: task.id, title, description });
    }
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => onClose()
    });
  };

  const handleAddSubtask = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (!newSubtaskTitle.trim()) return;
    createSubtask.mutate({ taskId: task.id, title: newSubtaskTitle }, {
      onSuccess: () => setNewSubtaskTitle("")
    });
  };

  const toggleTag = (tagId: number) => {
    const hasTag = task.tags.some(t => t.tagId === tagId);
    if (hasTag) {
      removeTag.mutate({ taskId: task.id, tagId });
    } else {
      assignTag.mutate({ taskId: task.id, tagId });
    }
  };

  return (
    <div className="h-full flex flex-col bg-card relative shadow-2xl z-10 border-l border-border/50">
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
        <h2 className="text-xl font-display font-bold">Task:</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Title & Description */}
        <div className="space-y-4">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveDetails}
            className="text-2xl font-bold font-display border-0 px-0 h-auto rounded-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary bg-transparent"
            placeholder="Task Title"
          />
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveDetails}
            placeholder="Add description..."
            className="min-h-[100px] resize-none border-border/50 bg-accent/20 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
          />
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-[100px_1fr] gap-y-6 items-center">
          <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
             <ListTodo className="h-4 w-4" /> List
          </span>
          <Select 
            value={task.listId?.toString() || "none"} 
            onValueChange={(val) => updateTask.mutate({ id: task.id, listId: val === "none" ? undefined : parseInt(val) })}
          >
            <SelectTrigger className="w-full bg-accent/20 border-border/50 rounded-lg">
              <SelectValue placeholder="Select list..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No List</SelectItem>
              {lists?.map(list => (
                <SelectItem key={list.id} value={list.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: list.color || '#ccc' }} />
                    {list.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Due Date
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`w-full justify-start text-left font-normal bg-accent/20 border-border/50 rounded-lg ${!task.dueDate && "text-muted-foreground"}`}>
                {task.dueDate ? format(new Date(task.dueDate), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => updateTask.mutate({ id: task.id, dueDate: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2 self-start mt-2">
            <Hash className="h-4 w-4" /> Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {task.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer pr-1" onClick={() => removeTag.mutate({ taskId: task.id, tagId: tag.id })}>
                {tag.name}
                <X className="h-3 w-3 ml-1 opacity-50 hover:opacity-100" />
              </Badge>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 rounded-full px-2 text-xs border-dashed text-muted-foreground">
                  <Plus className="h-3 w-3 mr-1" /> Add Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {allTags?.map(tag => (
                    <div 
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent"
                    >
                      <Checkbox 
                        checked={task.tags.some(t => t.tagId === tag.id)} 
                        className="mr-2 h-4 w-4"
                      />
                      {tag.name}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="text-lg font-bold font-display">Subtasks</h3>
          <div className="space-y-2">
            {task.subtasks?.map(sub => (
              <div key={sub.id} className="flex items-center group bg-accent/20 rounded-lg p-2 border border-transparent hover:border-border/50 transition-colors">
                <Checkbox 
                  checked={!!sub.completed}
                  onCheckedChange={(checked) => updateSubtask.mutate({ id: sub.id, taskId: task.id, completed: !!checked })}
                  className="mr-3 data-[state=checked]:bg-primary"
                />
                <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {sub.title}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteSubtask.mutate({ id: sub.id, taskId: task.id })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center mt-2 pl-2">
              <Plus className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleAddSubtask}
                onBlur={handleAddSubtask}
                placeholder="Add new subtask"
                className="h-8 border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm flex justify-between items-center">
        <p className="text-xs text-muted-foreground font-medium">
          Created {format(new Date(task.createdAt || Date.now()), 'MMM d')}
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="hover-elevate">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          <Button size="sm" onClick={handleSaveDetails} className="hover-elevate bg-foreground text-background hover:bg-foreground/90">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
