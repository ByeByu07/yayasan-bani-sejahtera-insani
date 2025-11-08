"use client"

import { useEffect, useState } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { defineStepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useSearchPatients,
  useCreatePatient,
  type Patient,
  type CreatePatientData
} from "@/hooks/use-patients";
import {
  useAvailableRooms,
  type Room
} from "@/hooks/use-rooms";
import { Search, UserPlus, Plus, Building2, CreditCard, Banknote } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const { Stepper } = defineStepper(
  { id: "step-1", title: "Data Pasien" },
  { id: "step-2", title: "Pilih Kamar" },
  { id: "step-3", title: "Metode Pembayaran" }
);

type RegistrationData = {
  patient: Patient | null;
  room: Room | null;
  paymentMethod: 'CASH' | 'TRANSFER' | null;
};

export default function RegistrationPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    patient: null,
    room: null,
    paymentMethod: null,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/worker" },
      { label: "Registrasi" },
    ])
  }, [setBreadcrumbs])

  return (
    <>
      <h1 className="text-2xl font-bold">Registrasi Pasien</h1>
      <Stepper.Provider className="space-y-4">
        {({ methods }) => (
          <>
            <Stepper.Navigation>
              {methods.all.map((step) => (
                <Stepper.Step key={step.id} of={step.id} onClick={() => methods.goTo(step.id)}>
                  <Stepper.Title>{step.title}</Stepper.Title>
                </Stepper.Step>
              ))}
            </Stepper.Navigation>
            {methods.switch({
              "step-1": (step) => (
                <PatientStep
                  id={step.id}
                  selectedPatient={registrationData.patient}
                  onPatientSelect={(patient) => {
                    setRegistrationData({ ...registrationData, patient });
                  }}
                />
              ),
              "step-2": (step) => (
                <RoomStep
                  id={step.id}
                  selectedRoom={registrationData.room}
                  onRoomSelect={(room) => {
                    setRegistrationData({ ...registrationData, room });
                  }}
                />
              ),
              "step-3": (step) => (
                <PaymentStep
                  id={step.id}
                  selectedPayment={registrationData.paymentMethod}
                  onPaymentSelect={(method) => {
                    setRegistrationData({ ...registrationData, paymentMethod: method });
                  }}
                  registrationData={registrationData}
                />
              ),
            })}
            <Stepper.Controls>
              <Button
                type="button"
                variant="secondary"
                onClick={methods.prev}
                disabled={methods.isFirst}
              >
                Sebelumnya
              </Button>
              <Button
                onClick={methods.isLast ? methods.reset : methods.next}
                disabled={
                  (methods.current.id === "step-1" && !registrationData.patient) ||
                  (methods.current.id === "step-2" && !registrationData.room) ||
                  (methods.isLast && !registrationData.paymentMethod)
                }
              >
                {methods.isLast ? "Selesai & Reset" : "Selanjutnya"}
              </Button>
            </Stepper.Controls>
          </>
        )}
      </Stepper.Provider>
    </>
  )
}

// Step 1: Patient Selection/Creation
const PatientStep = ({
  id,
  selectedPatient,
  onPatientSelect
}: {
  id: string;
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: searchResults, isLoading } = useSearchPatients(searchTerm);
  const createPatient = useCreatePatient();

  const [formData, setFormData] = useState<CreatePatientData>({
    name: "",
    birthDate: "",
    gender: "MALE",
    address: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalNotes: "",
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await createPatient.mutateAsync(formData);
      onPatientSelect(newPatient);
      setShowCreateForm(false);
      // Reset form
      setFormData({
        name: "",
        birthDate: "",
        gender: "MALE",
        address: "",
        phone: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalNotes: "",
      });
    } catch (error) {
      console.error("Failed to create patient:", error);
    }
  };

  return (
    <Stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      {selectedPatient ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pasien Terpilih</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPatientSelect(null as any)}
            >
              Ganti Pasien
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{selectedPatient.name}</CardTitle>
              <CardDescription>Kode: {selectedPatient.patientCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Jenis Kelamin:</span> {selectedPatient.gender}
                </div>
                <div>
                  <span className="font-medium">Tanggal Lahir:</span>{" "}
                  {format(new Date(selectedPatient.birthDate), "dd MMMM yyyy", { locale: localeId })}
                </div>
                {selectedPatient.phone && (
                  <div>
                    <span className="font-medium">Telepon:</span> {selectedPatient.phone}
                  </div>
                )}
                {selectedPatient.address && (
                  <div className="col-span-2">
                    <span className="font-medium">Alamat:</span> {selectedPatient.address}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {!showCreateForm ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Cari Pasien</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, kode pasien, atau nomor telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {isLoading && searchTerm.length >= 2 && (
                <p className="text-sm text-muted-foreground">Mencari...</p>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Hasil Pencarian</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <Card
                        key={patient.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onPatientSelect(patient)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patientCode} • {patient.phone}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              Pilih
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                <p className="text-sm text-muted-foreground">Tidak ada hasil ditemukan</p>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Pasien Baru
                </Button>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tambah Pasien Baru</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Batal
                </Button>
              </div>

              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Jenis Kelamin *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                        <SelectItem value="OTHER">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Telepon Darurat</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="emergencyContact">Kontak Darurat</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="medicalNotes">Catatan Medis</Label>
                    <Textarea
                      id="medicalNotes"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createPatient.isPending}>
                  {createPatient.isPending ? "Menyimpan..." : "Simpan Pasien"}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </Stepper.Panel>
  );
};

// Step 2: Room Selection
const RoomStep = ({
  id,
  selectedRoom,
  onRoomSelect
}: {
  id: string;
  selectedRoom: Room | null;
  onRoomSelect: (room: Room) => void;
}) => {
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const { data: rooms, isLoading } = useAvailableRooms(roomTypeFilter);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <Stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pilih Kamar</h3>
          <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Tipe Kamar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="ICU">ICU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Memuat kamar...</p>}

        {rooms && rooms.length === 0 && (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada kamar tersedia</p>
          </Card>
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-all ${
                  selectedRoom?.id === room.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => onRoomSelect(room)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
                      <CardDescription>{room.roomType}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(room.baseRate)}
                      </p>
                      <p className="text-xs text-muted-foreground">per hari</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kapasitas:</span>
                      <span className="font-medium">{room.capacity} orang</span>
                    </div>
                    {room.description && (
                      <p className="text-muted-foreground text-xs">{room.description}</p>
                    )}
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1">Fasilitas:</p>
                        <div className="flex flex-wrap gap-1">
                          {room.facilities.map((facility) => (
                            <span
                              key={facility.id}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {facility.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Stepper.Panel>
  );
};

// Step 3: Payment Method Selection
const PaymentStep = ({
  id,
  selectedPayment,
  onPaymentSelect,
  registrationData
}: {
  id: string;
  selectedPayment: 'CASH' | 'TRANSFER' | null;
  onPaymentSelect: (method: 'CASH' | 'TRANSFER') => void;
  registrationData: RegistrationData;
}) => {
  return (
    <Stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Metode Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Pilih metode pembayaran untuk pendaftaran ini
          </p>
        </div>

        <RadioGroup
          value={selectedPayment || ""}
          onValueChange={(value) => onPaymentSelect(value as 'CASH' | 'TRANSFER')}
          className="space-y-3"
        >
          <Card
            className={`cursor-pointer transition-all ${
              selectedPayment === "CASH" ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => onPaymentSelect("CASH")}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <RadioGroupItem value="CASH" id="cash" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Banknote className="h-6 w-6 text-green-600" />
                    <Label htmlFor="cash" className="text-lg font-semibold cursor-pointer">
                      Tunai (Cash)
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pembayaran dilakukan secara tunai di kasir
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedPayment === "TRANSFER" ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => onPaymentSelect("TRANSFER")}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <RadioGroupItem value="TRANSFER" id="transfer" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <Label htmlFor="transfer" className="text-lg font-semibold cursor-pointer">
                      Transfer Bank
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pembayaran melalui transfer bank
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>

        {selectedPayment && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Registrasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pasien:</span>
                <span className="font-medium">{registrationData.patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kamar:</span>
                <span className="font-medium">
                  {registrationData.room?.roomNumber} ({registrationData.room?.roomType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span className="font-medium">{selectedPayment}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Stepper.Panel>
  );
};