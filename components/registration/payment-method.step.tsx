"use client"

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, CheckCircle, Clock, CreditCard } from "lucide-react";
import { Patient } from "@/hooks/use-patients";
import { Room } from "@/hooks/use-rooms";
import { PaymentFormData } from "./payment-form.step";

type RegistrationData = {
  patient: Patient | null;
  room: Room | null;
  paymentForm: PaymentFormData | null;
  paymentMethod: 'CASH' | 'TRANSFER' | null;
};

export const PaymentMethodStep = ({
  id,
  stepper,
  selectedPayment,
  onPaymentSelect,
  registrationData
}: {
  id: string;
  stepper: any;
  selectedPayment: 'CASH' | 'TRANSFER' | null;
  onPaymentSelect: (method: 'CASH' | 'TRANSFER') => void;
  registrationData: RegistrationData;
}) => {
  return (
    <stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
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
            className={`cursor-pointer transition-all ${selectedPayment === "CASH" ? "ring-2 ring-primary" : "hover:shadow-md"
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
  className={`cursor-pointer transition-all duration-300 ${
    selectedPayment === "TRANSFER"
      ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
      : "hover:shadow-md hover:border-blue-200"
  }`}
  onClick={() => onPaymentSelect("TRANSFER")}
>
  <CardContent className="p-6">
    <div className="space-y-4">
      {/* Header with Radio and Title */}
      <div className="flex items-start space-x-4">
        <div className="mt-1">
          <RadioGroupItem 
            value="TRANSFER" 
            id="transfer" 
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <Label 
                htmlFor="transfer" 
                className="text-lg font-semibold cursor-pointer text-gray-900"
              >
                Transfer Bank
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transfer langsung ke rekening organisasi
              </p>
            </div>
          </div>
        </div>
        {selectedPayment === "TRANSFER" && (
          <div className="flex items-center space-x-1 text-blue-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-semibold">Dipilih</span>
          </div>
        )}
      </div>

      {/* Bank Details Section */}
      <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Rekening Tujuan
          </p>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded font-mono">
            <span className="font-semibold text-gray-900">0554 0103 5208 507</span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText("0554 0103 5208 507");
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Salin
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Atas Nama
          </p>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <span className="font-medium text-gray-900">Sri Minarni</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Kontak Person
          </p>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <span className="text-gray-900">
              <span className="font-medium">CP:</span> 081334614801
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText("081334614801");
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Salin
            </button>
          </div>
        </div>
      </div>

      {/* Info Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-900">💡 Tips Pembayaran:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✓ Transfer dapat dilakukan dari semua bank</li>
          <li>✓ Sertakan kode pasien di berita transfer</li>
          <li>✓ Konfirmasi pembayaran via WhatsApp CP</li>
        </ul>
      </div>

      {/* Processing Time */}
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Verifikasi pembayaran dalam 1-2 jam kerja</span>
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
    </stepper.Panel>
  );
};