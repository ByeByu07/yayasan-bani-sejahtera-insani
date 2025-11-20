import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const paymentFormSchema = z.object({
  kwNo: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai harus diisi"),
  amount: z.string().min(1, "Jumlah harus diisi"),
  paymentType: z.enum(["NURSING", "SNACK", "DOCTOR", "OTHER"], {
    errorMap: () => ({ message: "Jenis pembayaran harus dipilih" })
  }),
  otherDescription: z.string().optional(),
  nursingFee: z.string().optional(),
  snackFee: z.string().optional(),
  doctorCheckup: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

export const PaymentFormStep = ({
  id,
  stepper,
  onSubmit,
  registrationData,
}: {
  id: string;
  stepper: any;
  onSubmit: (data: PaymentFormData) => void;
  registrationData: any;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormData>({
    defaultValues: {
      kwNo: "",
      startDate: "",
      amount: "",
      paymentType: "NURSING",
      otherDescription: "",
      nursingFee: "",
      snackFee: "",
      doctorCheckup: "",
      additionalNotes: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        onSubmit(values.value);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const paymentType = form.getFieldValue("paymentType");

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/\D/g, "");
    if (!numValue) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numValue));
  };

  return (
    <div className="min-h-[600px] rounded-lg border bg-white p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Form Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Isi detail pembayaran untuk registrasi pasien
          </p>
        </div>

        {/* Patient Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Pasien:</span> {registrationData.patient?.name}
            </div>
            <div>
              <span className="font-medium">Kamar:</span> {registrationData.room?.roomNumber}
            </div>
          </CardContent>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* No. Kwitan */}
          <div>
            <form.Field
              name="kwNo"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>No. Kwitan</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Opsional"
                  />
                </div>
              )}
            />
          </div>

          {/* Start Date */}
          <div>
            <form.Field
              name="startDate"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>
                    Diterima dari <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Amount */}
          <div>
            <form.Field
              name="amount"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>
                    Sebesar <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2">Rp</span>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => {
                        const numValue = e.target.value.replace(/\D/g, "");
                        field.handleChange(numValue);
                      }}
                      placeholder="0"
                    />
                  </div>
                  {field.state.meta.errors && (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Payment Type */}
          <div>
            <Label className="mb-3 block">
              Pembayaran Rincian <span className="text-red-500">*</span>
            </Label>
            <form.Field
              name="paymentType"
              children={(field) => (
                <div className="space-y-3">
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value: any) => field.handleChange(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NURSING" id="nursing" />
                      <Label htmlFor="nursing" className="cursor-pointer">
                        Perawatan: Rp.
                      </Label>
                      <Input
                        className="w-32"
                        placeholder="....."
                        value={
                          paymentType === "NURSING" ? form.getFieldValue("nursingFee") : ""
                        }
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/\D/g, "");
                          form.setFieldValue("nursingFee", numValue);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SNACK" id="snack" />
                      <Label htmlFor="snack" className="cursor-pointer">
                        Snack/ keb. Diri: Rp.
                      </Label>
                      <Input
                        className="w-32"
                        placeholder="....."
                        value={
                          paymentType === "SNACK" ? form.getFieldValue("snackFee") : ""
                        }
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/\D/g, "");
                          form.setFieldValue("snackFee", numValue);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DOCTOR" id="doctor" />
                      <Label htmlFor="doctor" className="cursor-pointer">
                        Kontrol dokter: Rp.
                      </Label>
                      <Input
                        className="w-32"
                        placeholder="....."
                        value={
                          paymentType === "DOCTOR"
                            ? form.getFieldValue("doctorCheckup")
                            : ""
                        }
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/\D/g, "");
                          form.setFieldValue("doctorCheckup", numValue);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OTHER" id="other" />
                      <Label htmlFor="other" className="cursor-pointer">
                        Lain-lain:
                      </Label>
                      <Input
                        className="w-32"
                        placeholder="Rp. ....."
                        value={
                          paymentType === "OTHER" ? form.getFieldValue("otherDescription") : ""
                        }
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/\D/g, "");
                          form.setFieldValue("otherDescription", numValue);
                        }}
                      />
                    </div>
                  </RadioGroup>
                  {field.state.meta.errors && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <Label className="font-semibold">Total:</Label>
              <span className="text-lg font-bold">
                Rp {formatCurrency(form.getFieldValue("amount"))}
              </span>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <form.Field
              name="additionalNotes"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Catatan Tambahan</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                  />
                </div>
              )}
            />
          </div>

          {/* Signature Section */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium mb-8">User</p>
                <div className="h-16 border-t border-black"></div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Penerima</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Purwodadi, 202....
                </p>
                <div className="h-16 border-t border-black"></div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan & Selesai Registrasi"}
          </Button>
        </form>
      </div>
    </div>
  );
};