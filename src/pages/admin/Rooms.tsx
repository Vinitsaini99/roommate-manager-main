import React, { useMemo, useState } from "react";
import { DoorOpen, Plus, Search } from "lucide-react";
import { useData, Room } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoomModal from "@/components/rooms/RoomModal";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import { useRef, useEffect } from "react";



export default function AdminRooms() {
  const { rooms } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "occupied">("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);


 const filteredRooms = useMemo(() => {
  return rooms.filter(room => {
    const matchesSearch = room.roomNumber.toString().includes(searchQuery);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'available' && !room.isOccupied) ||
      (filter === 'occupied' && room.isOccupied);
    return matchesSearch && matchesFilter;
  });
}, [rooms, searchQuery, filter]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleAddNewRoom = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      cardRef.current &&
      !cardRef.current.contains(event.target as Node)
    ) {
      setActiveRoomId(null); // 🔥 hide Edit
    }
  }

  if (activeRoomId) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [activeRoomId]);


  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4">
        <div>
          <h1 className="page-title">Rooms Management</h1>
          <p className="page-subtitle">
            Manage all your rooms and tenant assignments
          </p>
        </div>
        <Button
          onClick={handleAddNewRoom}
          className="gradient-primary w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Room
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "available", "occupied"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap",
                filter === f ? "gradient-primary" : ""
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {rooms.length}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Total Rooms
            </p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-success">
              {rooms.filter((r) => !r.isOccupied).length}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Available
            </p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-destructive">
              {rooms.filter((r) => r.isOccupied).length}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Occupied</p>
          </div>
        </div>
      </div>

      {/* Room Cards Grid - Responsive: 1 col mobile, 2 tablet, 3-5 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        
        {filteredRooms.map((room) => (
          <div
  ref={activeRoomId === room.id ? cardRef : null}
  role="button"
  tabIndex={0}
  onClick={() => {
    if (room.isOccupied) {
      setActiveRoomId(room.id);
    } else {
      handleRoomClick(room);
    }
  }}
  className={cn(
    "relative rounded-xl border p-4 transition-all cursor-pointer",
    activeRoomId === room.id
      ? "ring-2 ring-primary shadow-lg"
      : "border-border"
  )}



//     {activeRoomId === room.id && (
//   <Button
//     size="sm"
//     className="ml-2"
//     onClick={(e) => {
//       e.stopPropagation();
//       handleRoomClick(room); // 🔥 modal open here
//     }}
//   >
//     Edit
//   </Button>
// )}

>

           <div className="flex items-center justify-between mb-3">
  <span className="text-base md:text-lg font-bold text-foreground">
    #{room.roomNumber}
  </span>

  <div className="flex items-center gap-2">
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        room.isOccupied
          ? "bg-destructive/10 text-destructive"
          : "bg-success/10 text-success"
      )}
    >
      {room.isOccupied ? "Occupied" : "Available"}
    </span>

 {room.isOccupied && activeRoomId === room.id && (
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
    <Button
      size="lg"
      className="gradient-primary"
      onClick={(e) => {
        e.stopPropagation();
        handleRoomClick(room);
      }}
    >
      Edit Room
    </Button>
  </div>
)}



  </div>
</div>


            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">
                  {room.type === "single"
                    ? "Single"
                    : room.type === "double"
                    ? "Double"
                    : "Triple"}{" "}
                  Bed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AC</span>
                <span className="font-medium text-foreground">
                  {room.isAC ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rent</span>
                <span className="font-medium text-primary">
                  {formatCurrency(room.rent)}
                </span>
              </div>
            </div>

            {room.isOccupied && room.tenants.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Tenant(s)</p>
                {room.tenants.map((tenant) => (
                  <p
                    key={tenant.id}
                    className="text-sm font-medium text-foreground truncate"
                  >
                    {tenant.firstName} {tenant.lastName}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <DoorOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      <RoomModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoom(null);
          setActiveRoomId(null); // ✅ reset
        }}
      />
    </div>
  );
}
