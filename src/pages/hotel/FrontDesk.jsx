import { useState } from 'react';
import { BedDouble, Calendar, UserCheck, LogIn, LogOut, CheckCircle2, Settings, Brush, Moon, Clock, Key, Users, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

// Generate room numbers 101-320
const ALL_ROOMS = [];
for (let floor = 1; floor <= 3; floor++) {
  for (let room = 1; room <= 20; room++) {
    ALL_ROOMS.push(`${floor}${String(room).padStart(2, '0')}`);
  }
}

const getRoomStatus = (roomNumber, reservations, today) => {
  const active = reservations.find(r => {
    const rn = String(r.roomNumber);
    return rn === String(roomNumber) &&
      (r.status === 'Checked-in' || r.status === 'Confirmed');
  });
  if (!active) return { status: 'Available', reservation: null };
  if (active.status === 'Checked-in') return { status: 'Occupied', reservation: active };
  if (active.status === 'Confirmed' && active.checkIn === today) return { status: 'Arriving', reservation: active };
  return { status: 'Reserved', reservation: active };
};

const statusColors = {
  Available:  'bg-green-50 border-green-300 text-green-800 hover:bg-green-100',
  Occupied:   'bg-red-50 border-red-300 text-red-800 hover:bg-red-100',
  Arriving:   'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100',
  Reserved:   'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100',
  Cleaning:   'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100',
  Maintenance:'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
};

const statusIcons = {
  Available:   <CheckCircle2 className="w-4 h-4 text-green-500" />,
  Occupied:    <Moon className="w-4 h-4 text-red-500" />,
  Arriving:    <LogIn className="w-4 h-4 text-amber-500" />,
  Reserved:    <Calendar className="w-4 h-4 text-blue-500" />,
  Cleaning:    <Brush className="w-4 h-4 text-yellow-500" />,
  Maintenance: <Settings className="w-4 h-4 text-slate-500" />,
};

export default function FrontDesk() {
  const today = new Date().toISOString().split('T')[0];

  const { data: dbRecords = [], isLoading } = useIndustryRecords('reservation');
  const mutateRecord = useMutateIndustryRecord();

  const reservations = dbRecords.map(r => ({ id: r.id, status: r.status || 'Confirmed', ...r.data }));

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInForm, setCheckInForm] = useState({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: '' });

  const todayArrivals   = reservations.filter(r => r.checkIn === today && r.status === 'Confirmed');
  const todayDepartures = reservations.filter(r => r.checkOut === today && r.status === 'Checked-in');
  const checkedIn       = reservations.filter(r => r.status === 'Checked-in');
  const occupancyRate   = ALL_ROOMS.length > 0 ? Math.round((checkedIn.length / ALL_ROOMS.length) * 100) : 0;

  const getRoomInfo = (roomNumber) => getRoomStatus(roomNumber, reservations, today);

  const handleCheckIn = () => {
    if (!checkInForm.guestName.trim()) return toast.error('Please enter guest name');
    if (!checkInForm.checkOut) return toast.error('Please enter check-out date');
    const nights = Math.max(1, Math.ceil((new Date(checkInForm.checkOut) - new Date(today)) / 86400000));
    const rates = { Standard: 150, Single: 120, Double: 180, Suite: 400, Deluxe: 280 };
    const total = nights * (rates[checkInForm.roomType] || 150);
    const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    mutateRecord.mutate({
      recordType: 'reservation',
      payload: {
        reservationId,
        guestName: checkInForm.guestName,
        guestPhone: checkInForm.guestPhone,
        roomNumber: selectedRoom,
        roomType: checkInForm.roomType,
        checkIn: today,
        checkOut: checkInForm.checkOut,
        nights,
        totalAmount: total,
      },
      status: 'Checked-in',
      searchText: `${checkInForm.guestName} ${reservationId} ${selectedRoom}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${selectedRoom} checked in for ${checkInForm.guestName}`);
        setShowCheckInModal(false);
        setSelectedRoom(null);
        setCheckInForm({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: '' });
      },
      onError: (err) => toast.error('Check-in failed: ' + err.message)
    });
  };

  const handleCheckOut = (reservation) => {
    mutateRecord.mutate({
      id: reservation.id,
      recordType: 'reservation',
      payload: { ...reservation },
      status: 'Checked-out',
      searchText: `${reservation.guestName} ${reservation.reservationId} ${reservation.roomNumber}`
    }, {
      onSuccess: () => {
        toast.success(`Room ${reservation.roomNumber} checked out successfully`);
        setSelectedRoom(null);
      },
      onError: (err) => toast.error('Check-out failed: ' + err.message)
    });
  };

  const selectedRoomInfo = selectedRoom ? getRoomInfo(selectedRoom) : null;

  const floors = [1, 2, 3];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Front Desk</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live property overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Occupancy</p>
              <p className="text-2xl font-bold text-amber-600">{occupancyRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Arrivals Today</p>
              <p className="text-2xl font-bold text-green-600">{todayArrivals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Departures Today</p>
              <p className="text-2xl font-bold text-red-600">{todayDepartures.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Guests In-House</p>
              <p className="text-2xl font-bold text-blue-600">{checkedIn.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary Strips */}
      {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayArrivals.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                <LogIn className="w-4 h-4" /> Today's Arrivals ({todayArrivals.length})
              </h3>
              <div className="space-y-2">
                {todayArrivals.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-green-900">{r.guestName}</span>
                    <span className="text-green-700 font-mono text-xs">Room {r.roomNumber}</span>
                  </div>
                ))}
                {todayArrivals.length > 4 && <p className="text-xs text-green-700 font-medium">+{todayArrivals.length - 4} more</p>}
              </div>
            </div>
          )}
          {todayDepartures.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                <LogOut className="w-4 h-4" /> Today's Departures ({todayDepartures.length})
              </h3>
              <div className="space-y-2">
                {todayDepartures.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-red-900">{r.guestName}</span>
                    <span className="text-red-700 font-mono text-xs">Room {r.roomNumber}</span>
                  </div>
                ))}
                {todayDepartures.length > 4 && <p className="text-xs text-red-700 font-medium">+{todayDepartures.length - 4} more</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Grid */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border">
            {Object.entries(statusColors).map(([s]) => (
              <div key={s} className="flex items-center gap-1.5">
                {statusIcons[s]}
                <span className="text-xs font-bold text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">Loading room status...</div>
          ) : (
            <div className="space-y-6">
              {floors.map(floor => (
                <div key={floor}>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">{floor}</span>
                    Floor {floor}
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {ALL_ROOMS.filter(rn => rn.startsWith(String(floor))).map(roomNum => {
                      const info = getRoomInfo(roomNum);
                      const isSelected = selectedRoom === roomNum;
                      return (
                        <button
                          key={roomNum}
                          onClick={() => setSelectedRoom(isSelected ? null : roomNum)}
                          className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-150 text-center ${statusColors[info.status]} ${isSelected ? 'ring-4 ring-amber-400 scale-110 shadow-lg z-10 relative' : ''}`}
                        >
                          {statusIcons[info.status]}
                          <span className="text-[10px] font-bold mt-0.5 leading-tight">{roomNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col min-h-[400px]">
          {selectedRoom && selectedRoomInfo ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">Room {selectedRoom}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {statusIcons[selectedRoomInfo.status]}
                    <span className="text-sm font-semibold text-muted-foreground">{selectedRoomInfo.status}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedRoomInfo.reservation && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Guest Info</p>
                  <p className="font-bold text-card-foreground text-lg">{selectedRoomInfo.reservation.guestName}</p>
                  {selectedRoomInfo.reservation.guestPhone && (
                    <p className="text-sm text-muted-foreground">{selectedRoomInfo.reservation.guestPhone}</p>
                  )}
                  <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Check-in</span>
                      <span className="font-bold">{selectedRoomInfo.reservation.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Check-out</span>
                      <span className="font-bold">{selectedRoomInfo.reservation.checkOut}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Room Type</span>
                      <span className="font-bold">{selectedRoomInfo.reservation.roomType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
                      <span className="font-bold text-amber-600">${selectedRoomInfo.reservation.totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {selectedRoomInfo.status === 'Available' && (
                  <Button
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    <Key className="w-4 h-4" /> Check In Guest
                  </Button>
                )}
                {selectedRoomInfo.status === 'Arriving' && (
                  <Button
                    onClick={() => {
                      mutateRecord.mutate({
                        id: selectedRoomInfo.reservation.id,
                        recordType: 'reservation',
                        payload: { ...selectedRoomInfo.reservation },
                        status: 'Checked-in',
                        searchText: `${selectedRoomInfo.reservation.guestName} ${selectedRoomInfo.reservation.reservationId}`
                      }, {
                        onSuccess: () => { toast.success('Guest checked in!'); setSelectedRoom(null); },
                        onError: (err) => toast.error(err.message)
                      });
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <UserCheck className="w-4 h-4" /> Confirm Check-In
                  </Button>
                )}
                {selectedRoomInfo.status === 'Occupied' && (
                  <Button
                    onClick={() => handleCheckOut(selectedRoomInfo.reservation)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Check Out
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <BedDouble className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">Select a room</p>
              <p className="text-xs mt-1">Click any room on the grid to view details and manage check-in/out</p>
            </div>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" /> Walk-in Check-In — Room {selectedRoom}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Guest Name *</label>
                <Input value={checkInForm.guestName} onChange={e => setCheckInForm({ ...checkInForm, guestName: e.target.value })} className="mt-1" placeholder="e.g. Jane Doe" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input value={checkInForm.guestPhone} onChange={e => setCheckInForm({ ...checkInForm, guestPhone: e.target.value })} className="mt-1" placeholder="e.g. +1 555 0100" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Room Type</label>
                <select value={checkInForm.roomType} onChange={e => setCheckInForm({ ...checkInForm, roomType: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Single</option>
                  <option>Double</option>
                  <option>Standard</option>
                  <option>Deluxe</option>
                  <option>Suite</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Check-Out Date *</label>
                <Input type="date" value={checkInForm.checkOut} min={today} onChange={e => setCheckInForm({ ...checkInForm, checkOut: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCheckInModal(false); setCheckInForm({ guestName: '', guestPhone: '', roomType: 'Standard', checkOut: '' }); }}>Cancel</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCheckIn}>Confirm Check-In</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
