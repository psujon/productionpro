import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css'
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import { AuthProvider } from './AuthContextProvider/AuthContextProvider';
import { Toaster } from 'react-hot-toast';

// Lazy load components
const Buyer = lazy(() => import('./components/Buyer'));
const Style = lazy(() => import('./components/Style'));
const BuyerOrder = lazy(() => import('./components/BuyerOrder'));
const Accessories = lazy(() => import('./components/Accessories'));
const AccessoriesType = lazy(() => import('./components/AccessoriesType'));
const AccessoriesUnit = lazy(() => import('./components/AccessoriesUnit'));
const Country = lazy(() => import('./components/Country'));
const Merchandiser = lazy(() => import('./components/Merchandiser'));
const Products = lazy(() => import('./components/Products'));
const StyleRate = lazy(() => import('./components/StyleRate'));
const ProductionEntry = lazy(() => import('./components/ProductionEntry'));
const ProductionEntryShow = lazy(() => import('./components/ProductionEntryShow'));
const EmployeeInformation = lazy(() => import('./components/EmployeeInformation'));
const ErrorPage = lazy(() => import('./components/ErrorPage'));
const Reports = lazy(() => import('./components/Reports'));
const Process = lazy(() => import('./components/Process'));
const Users = lazy(() => import('./components/Users'));
const Department = lazy(() => import('./components/Department'));
const Section = lazy(() => import('./components/Section'));
const BlockLine = lazy(() => import('./components/BlockLine'));
const Useractivitylogs = lazy(() => import('./components/Useractivitylogs'));
const Permission = lazy(() => import('./components/Permission'));
const Community = lazy(() => import('./components/Community'));
const Tickets = lazy(() => import('./components/Tickets'));
const BackupDatabase = lazy(() => import('./components/BackupDatabase'));
const DatabaseLock = lazy(() => import('./components/DatabaseLock'));

// finally the App component itself router management with auth provider

function App() {
  return (
    <div className='m-auto'>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <Routes>
            <Route path='/' element={<Login />} />

            {/* /dashboard is protected by the Dashboard auth-guard */}
            <Route path='/dashboard' element={<Dashboard />}>
              {/* Single DashboardLayout wrapper for all dashboard child routes */}
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path='buyer' element={<Suspense fallback={<div>Loading...</div>}><Buyer /></Suspense>} />
                <Route path='style' element={<Suspense fallback={<div>Loading...</div>}><Style /></Suspense>} />
                <Route path='StyleRate' element={<Suspense fallback={<div>Loading...</div>}><StyleRate /></Suspense>} />
                <Route path='buyerOrder' element={<Suspense fallback={<div>Loading...</div>}><BuyerOrder /></Suspense>} />
                <Route path='accessories' element={<Suspense fallback={<div>Loading...</div>}><Accessories /></Suspense>} />
                <Route path='accessoriesType' element={<Suspense fallback={<div>Loading...</div>}><AccessoriesType /></Suspense>} />
                <Route path='accessoriesUnit' element={<Suspense fallback={<div>Loading...</div>}><AccessoriesUnit /></Suspense>} />
                <Route path='country' element={<Suspense fallback={<div>Loading...</div>}><Country /></Suspense>} />
                <Route path='merchandiser' element={<Suspense fallback={<div>Loading...</div>}><Merchandiser /></Suspense>} />
                <Route path='products' element={<Suspense fallback={<div>Loading...</div>}><Products /></Suspense>} />
                <Route path='ProductionEntry' element={<Suspense fallback={<div>Loading...</div>}><ProductionEntry /></Suspense>} />
                <Route path='ProductionShow' element={<Suspense fallback={<div>Loading...</div>}><ProductionEntryShow /></Suspense>} />
                <Route path='ProductionReceived' element={<Suspense fallback={<div>Loading...</div>}><ErrorPage /></Suspense>} />
                <Route path='employeeInformation' element={<Suspense fallback={<div>Loading...</div>}><EmployeeInformation /></Suspense>} />
                <Route path='Reports' element={<Suspense fallback={<div>Loading...</div>}><Reports /></Suspense>} />
                <Route path='Process' element={<Suspense fallback={<div>Loading...</div>}><Process /></Suspense>} />
                <Route path='users' element={<Suspense fallback={<div>Loading...</div>}><Users /></Suspense>} />
                <Route path='department' element={<Suspense fallback={<div>Loading...</div>}><Department /></Suspense>} />
                <Route path='section' element={<Suspense fallback={<div>Loading...</div>}><Section /></Suspense>} />
                <Route path='blockLine' element={<Suspense fallback={<div>Loading...</div>}><BlockLine /></Suspense>} />
                <Route path='Useractivitylogs' element={<Suspense fallback={<div>Loading...</div>}><Useractivitylogs /></Suspense>} />
                <Route path='permission' element={<Suspense fallback={<div>Loading...</div>}><Permission /></Suspense>} />
                <Route path='community' element={<Suspense fallback={<div>Loading...</div>}><Community /></Suspense>} />
                <Route path='tickets' element={<Suspense fallback={<div>Loading...</div>}><Tickets /></Suspense>} />
                <Route path='backup' element={<Suspense fallback={<div>Loading...</div>}><BackupDatabase /></Suspense>} />
                <Route path='databaselock' element={<Suspense fallback={<div>Loading...</div>}><DatabaseLock /></Suspense>} />
                {/* Add more dashboard routes here as needed */}
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
