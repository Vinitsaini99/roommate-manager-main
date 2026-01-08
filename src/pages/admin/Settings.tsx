import React, { useState } from 'react';
import { DoorOpen, IndianRupee, Zap, Save, RotateCcw } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

export default function AdminSettings() {
  const { settings, updateSettings, initializeRooms, rooms } = useData();
  const { toast } = useToast();

  const [totalRooms, setTotalRooms] = useState(settings.totalRooms);
  const [electricityRate, setElectricityRate] = useState(settings.electricityRate);
  const [rentRates, setRentRates] = useState(settings.rentRates);

  const handleSaveSettings = () => {
    updateSettings({
      electricityRate,
      rentRates,
    });
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handleInitializeRooms = () => {
    if (totalRooms < 1 || totalRooms > 500) {
      toast({
        title: 'Invalid room count',
        description: 'Please enter a number between 1 and 500.',
        variant: 'destructive',
      });
      return;
    }
    initializeRooms(totalRooms);
    toast({
      title: 'Rooms initialized',
      description: `${totalRooms} rooms have been created.`,
    });
  };

  const handleResetDefaults = () => {
    setElectricityRate(8);
    setRentRates({
      singleNonAC: 3000,
      singleAC: 4000,
      doubleNonAC: 6000,
      doubleAC: 10000,
      tripleNonAC: 9000,
      tripleAC: 14000,
    });
    toast({
      title: 'Reset to defaults',
      description: 'Settings have been reset to default values.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your PG management settings</p>
      </div>

      {/* Room Configuration */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Room Configuration</h2>
            <p className="text-sm text-muted-foreground">Set up total number of rooms</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Current rooms: <span className="font-semibold text-foreground">{rooms.length}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Initializing rooms will reset all existing room data. Use with caution.
          </p>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs space-y-2">
            <Label>Total Number of Rooms</Label>
            <Input
              type="number"
              value={totalRooms}
              onChange={(e) => setTotalRooms(Number(e.target.value))}
              min={1}
              max={500}
            />
          </div>
          <Button onClick={handleInitializeRooms} variant="outline">
            Initialize Rooms
          </Button>
        </div>
      </div>

      {/* Electricity Rate */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Electricity Rate</h2>
            <p className="text-sm text-muted-foreground">Set per unit electricity charge</p>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs space-y-2">
            <Label>Rate per Unit (₹)</Label>
            <Input
              type="number"
              value={electricityRate}
              onChange={(e) => setElectricityRate(Number(e.target.value))}
              min={1}
            />
          </div>
          <span className="text-muted-foreground pb-2">₹ / unit</span>
        </div>
      </div>

      {/* Rent Rates */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rent Rates</h2>
            <p className="text-sm text-muted-foreground">Configure default rent for each room type</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-section">
            <h3 className="font-medium text-foreground mb-4">Single Bed Rooms</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Non-AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.singleNonAC}
                  onChange={(e) => setRentRates({ ...rentRates, singleNonAC: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.singleAC}
                  onChange={(e) => setRentRates({ ...rentRates, singleAC: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="font-medium text-foreground mb-4">Double Bed Rooms</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Non-AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.doubleNonAC}
                  onChange={(e) => setRentRates({ ...rentRates, doubleNonAC: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.doubleAC}
                  onChange={(e) => setRentRates({ ...rentRates, doubleAC: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="font-medium text-foreground mb-4">Triple Bed Rooms</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Non-AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.tripleNonAC}
                  onChange={(e) => setRentRates({ ...rentRates, tripleNonAC: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>AC (₹ / month)</Label>
                <Input
                  type="number"
                  value={rentRates.tripleAC}
                  onChange={(e) => setRentRates({ ...rentRates, tripleAC: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Rates Summary */}
        <div className="bg-muted/50 rounded-xl p-4 mt-6">
          <h4 className="font-medium text-foreground mb-3">Rate Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Single Non-AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.singleNonAC)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Single AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.singleAC)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Double Non-AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.doubleNonAC)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Double AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.doubleAC)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Triple Non-AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.tripleNonAC)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Triple AC</p>
              <p className="font-semibold text-foreground">{formatCurrency(rentRates.tripleAC)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleResetDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings} className="gradient-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
