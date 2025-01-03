import { supabase } from "@/integrations/supabase/client";
import { NavigateFunction } from "react-router-dom";
import { type ToastProps } from "@/components/ui/toast";

interface OrderSubmissionProps {
  pageCount: number;
  copies: number;
  selectedGsm: string;
  selectedType: string;
  selectedSides: string;
  deliveryType: string;
  fileUrl: string;
  userProfile: any;
  navigate: NavigateFunction;
  toast: {
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
  };
}

export const useOrderSubmission = ({
  pageCount,
  copies,
  selectedGsm,
  selectedType,
  selectedSides,
  deliveryType,
  fileUrl,
  userProfile,
  navigate,
  toast,
}: OrderSubmissionProps) => {
  const calculateTotal = () => {
    const pricingOptions = [
      { gsm: "70", type: "bw", sides: "single", pricePerPage: 0.8 },
      { gsm: "70", type: "bw", sides: "double", pricePerPage: 1.0 },
      { gsm: "70", type: "color", sides: "single", pricePerPage: 2.5 },
      { gsm: "70", type: "color", sides: "double", pricePerPage: 4.5 },
      { gsm: "100", type: "bw", sides: "single", pricePerPage: 2.0 },
      { gsm: "100", type: "bw", sides: "double", pricePerPage: 3.0 },
      { gsm: "100", type: "color", sides: "single", pricePerPage: 3.0 },
      { gsm: "100", type: "color", sides: "double", pricePerPage: 5.0 },
    ];

    const selectedOption = pricingOptions.find(
      (option) =>
        option.gsm === selectedGsm &&
        option.type === selectedType &&
        option.sides === selectedSides
    );

    if (!selectedOption || !pageCount) return 0;

    const printingCost = selectedOption.pricePerPage * pageCount * copies;
    const courierCharge = deliveryType === "pickup" ? 0 : (pageCount <= 400 ? 80 : 150);
    return printingCost + courierCharge;
  };

  const handleWhatsAppRedirect = () => {
    const message = `Hi, I would like to enquire about printing ${pageCount} pages:\n` +
      `Copies: ${copies}\n` +
      `Paper: ${selectedGsm}gsm\n` +
      `Type: ${selectedType === 'bw' ? 'Black & White' : 'Color'}\n` +
      `Sides: ${selectedSides === 'single' ? 'Single side' : 'Both sides'}\n` +
      `Delivery: ${deliveryType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n` +
      `Total Amount: ₹${calculateTotal().toFixed(2)}`;

    const phoneNumber = "918777060249";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const createOrder = async () => {
    const total = calculateTotal();
    
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: `${userProfile.firstName} ${userProfile.lastName}`,
          customer_email: userProfile.email,
          customer_phone: userProfile.phone,
          pages: pageCount,
          copies,
          gsm: selectedGsm,
          print_type: selectedType,
          print_sides: selectedSides,
          delivery_type: deliveryType,
          file_path: fileUrl,
          file_url: fileUrl,
          amount: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      localStorage.setItem('currentOrder', JSON.stringify({
        orderId: orderData.id,
        pageCount,
        copies,
        selectedGsm,
        selectedType,
        selectedSides,
        deliveryType,
        fileUrl,
        total,
      }));

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('handle-phonepe-payment', {
        body: {
          orderId: orderData.id,
          amount: total,
        }
      });

      if (paymentError) throw paymentError;

      if (paymentData.success) {
        window.location.href = paymentData.data.instrumentResponse.redirectInfo.url;
      } else {
        throw new Error(paymentData.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive",
      });
    }
  };

  return {
    handleWhatsAppRedirect,
    handleProceedToPayment: createOrder,
  };
};