"use client"

import { useEffect, useState } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { defineStepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import {
  type Room
} from "@/hooks/use-rooms";
import {
  type Patient,
} from "@/hooks/use-patients";
import { PaymentFormStep } from "@/components/registration/payment-form.step";
import { PaymentFormData } from "@/components/registration/payment-form.step";
import { PatientStep } from "@/components/registration/patient.step";
import { RoomStep } from "@/components/registration/room.step";     
import { PaymentMethodStep } from "@/components/registration/payment-method.step" ;

const { Stepper } = defineStepper(
  { id: "step-1", title: "Data Pasien" },
  { id: "step-2", title: "Pilih Kamar" },
  { id: "step-3", title: "Detail Pembayaran" },
  { id: "step-4", title: "Metode Pembayaran" },
);

type RegistrationData = {
  patient: Patient | null;
  room: Room | null;
  paymentForm: PaymentFormData | null;
  paymentMethod: 'CASH' | 'TRANSFER' | null;
};

export default function RegistrationPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    patient: null,
    room: null,
    paymentForm: null,
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
                  <Stepper.Title className="hidden md:inline">{step.title}</Stepper.Title>
                </Stepper.Step>
              ))}
            </Stepper.Navigation>
            {methods.switch({
              "step-1": (step) => (
                <PatientStep
                  id={step.id}
                  stepper={Stepper}
                  selectedPatient={registrationData.patient}
                  onPatientSelect={(patient) => {
                    setRegistrationData({ ...registrationData, patient });
                  }}
                />
              ),
              "step-2": (step) => (
                <RoomStep
                  id={step.id}
                  stepper={Stepper}
                  selectedRoom={registrationData.room}
                  onRoomSelect={(room) => {
                    setRegistrationData({ ...registrationData, room });
                  }}
                />
              ),
              "step-3": (step) => (
                <PaymentFormStep
                  id={step.id}
                  stepper={Stepper}
                  onSubmit={(data) => {
                    setRegistrationData({ ...registrationData, paymentForm: data });
                    // Handle final submission here
                    console.log("Registration complete:", registrationData);
                  }}
                  registrationData={registrationData}
                />
              ),
              "step-4": (step) => (
                <PaymentMethodStep
                  id={step.id}
                  stepper={Stepper}
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