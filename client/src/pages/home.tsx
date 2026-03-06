import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, type FilterType } from "@/components/app-sidebar";
import { TaskListPane } from "@/components/task-list-pane";
import { TaskDetailPane } from "@/components/task-detail-pane";
import { CreateListDialog } from "@/components/create-list-dialog";

export default function Home() {
  const [filter, setFilter] = useState<FilterType>({ type: 'today', name: 'Today' });
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  // When changing filters, deselect task on mobile or small screens 
  // (In a full app we might use window width to decide, but keeping it simple)
  const handleSelectFilter = (newFilter: FilterType) => {
    setFilter(newFilter);
    setSelectedTaskId(null); // Optional: reset selected task on category change
  };

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
        {/* Pane 1: Sidebar */}
        <AppSidebar 
          selectedFilter={filter} 
          onSelectFilter={handleSelectFilter} 
          onCreateListClick={() => setIsCreateListOpen(true)}
        />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Pane 2: Task List */}
          <div className="flex-1 min-w-[320px] max-w-full z-0 h-full">
            <TaskListPane 
              filter={filter} 
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
          
          {/* Pane 3: Task Details */}
          <div className={`w-96 flex-shrink-0 h-full transition-all duration-300 ease-in-out transform ${selectedTaskId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0'}`}>
            <TaskDetailPane 
              taskId={selectedTaskId} 
              onClose={() => setSelectedTaskId(null)} 
            />
          </div>
        </main>
      </div>

      <CreateListDialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen} />
    </SidebarProvider>
  );
}
