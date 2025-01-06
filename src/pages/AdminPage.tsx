import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { OrderCard } from "@/components/admin/OrderCard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OrdersTable } from "@/integrations/supabase/types/orders";

type Order = OrdersTable['Row'];

const AdminPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchOrders();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedOrders = (data || []).map(order => ({
        ...order,
        street: order.street || '',
        city: order.city || '',
        state: order.state || '',
        pincode: order.pincode || '',
      })) as Order[];
      
      setOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Remove the order from the local state
    setOrders(orders.filter(order => order.id !== orderId));
    // Refresh the orders list to ensure sync with database
    await fetchOrders();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <p className="text-center text-gray-500">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 md:px-8">
        <div className="bg-white p-4 md:p-8 rounded-lg shadow">
          <AdminHeader onLogout={handleLogout} />
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
        </div>
      </div>
    </div>
  );
};

export default AdminPage;