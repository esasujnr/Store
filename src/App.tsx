import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import Layout from '@/components/layout/Layout'
import RequireAuth from '@/components/auth/RequireAuth'
import RequireAdmin from '@/components/auth/RequireAdmin'
import AdminLayout from '@/components/admin/AdminLayout'
import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import CollectionPage from '@/pages/CollectionPage'
import DronesPage from '@/pages/DronesPage'
import ProductPage from '@/pages/ProductPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminProductForm from '@/pages/admin/AdminProductForm'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminDiscounts from '@/pages/admin/AdminDiscounts'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminContent from '@/pages/admin/AdminContent'
import AdminMedia from '@/pages/admin/AdminMedia'
import AdminBrands from '@/pages/admin/AdminBrands'
import AdminCollections from '@/pages/admin/AdminCollections'

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="shop/:categorySlug" element={<ShopPage />} />
              <Route path="collection/:slug" element={<CollectionPage />} />
              <Route path="drones" element={<DronesPage />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id/edit" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="discounts" element={<AdminDiscounts />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="collections" element={<AdminCollections />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
