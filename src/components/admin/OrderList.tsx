import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrderCard } from "./OrderCard";
import { OrdersTable } from "@/integrations/supabase/types/orders";

type Order = OrdersTable['Row'];

interface OrderListProps {
  initialOrders: Order[];
}

export const OrderList = ({ initialOrders }: OrderListProps) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('New order received:', payload);
          if (payload.new) {
            setOrders(currentOrders => [payload.new as Order, ...currentOrders]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order updated:', payload);
          if (payload.new) {
            setOrders(currentOrders =>
              currentOrders.map(order =>
                order.id === (payload.new as Order).id ? (payload.new as Order) : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onDelete={handleDeleteOrder}
        />
      ))}
      {orders.length === 0 && (
        <p className="text-center text-gray-500">No orders yet</p>
      )}
    </div>
  );
};