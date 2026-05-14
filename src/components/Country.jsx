import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../AuthContextProvider/AuthContextProvider';
import axios from 'axios';
import toast from 'react-hot-toast';

const Country = () => {
  const { server_url } = useAuthContext();
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    country: '',
    short_code: ''
  });

  const FetchCountryData = async () => {
    try {
      const response = await axios.get(`${server_url}/globalFetch/country/list`);
      if (response.data) {
        setBuyers(response.data)
      }
    }
    catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    FetchCountryData()
  }, []);

  // Search functionality
  const filteredBuyers = buyers.filter(buyer =>
    Object.values(buyer).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort functionality
  const sortedBuyers = [...filteredBuyers].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddNew = () => {
    setEditingBuyer(null);
    setFormData({
      CountryName: '',
      CountryShortValue: ''
    });
    setIsModalOpen(!isModalOpen);
  };

  const handleEdit = (buyer) => {
    setEditingBuyer(buyer);
    setFormData({
      country: buyer.country,
      short_code: buyer.short_code
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this country?')) {
      try {
        const response = await axios.post(`${server_url}/globalFetch/country/delete`, { id });
        if (response.data) {
          toast.success('Country deleted successfully');
          FetchCountryData();
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete country');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingBuyer) {
      // Update existing country
      try {
        const response = await axios.post(`${server_url}/globalFetch/country/update`, {
          id: editingBuyer.id,
          ...formData
        });
        if (response.data) {
          toast.success('Country updated successfully');
          FetchCountryData();
        }
      } catch (error) {
        console.error('Update error:', error);
        toast.error('Failed to update country');
      }
    } else {
      try {
        const response = await axios.post(`${server_url}/globalFetch/country/add`, formData);
        if (response.data && response.data.success) {
          toast.success(response.data.message)
          FetchCountryData();
        } else {
          toast.error(response.data.message || 'Failed to add country')
        }
      } catch (error) {
        console.error('Add error:', error);
        toast.error('Failed to add country');
      }
    }

    setIsModalOpen(false);
    setEditingBuyer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl px-8 font-bold text-slate-800">Country Management</h1>
          {/* <p className="text-gray-600 mt-1">Manage your buyers and their information</p> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Country
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`transition-all duration-300 ease-in-out overflow-hidden 'max-h-[200px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="premium-card rounded-lg shadow-xl w-full p-4 mb-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Country Name
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Country Short Name
                </label>
                <input
                  type="text"
                  name="short_code"
                  value={formData.short_code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>


              <div className="space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 premium-card border border-gray-300 rounded-lg hover: focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  {editingBuyer ? 'Update' : 'Add'} Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Buyers</p>
              <p className="text-2xl font-bold text-slate-800">{buyers.length}</p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-slate-800">
                {buyers.filter(b => b.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-slate-800">
                {buyers.filter(b => b.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="premium-card p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
              <p className="text-sm font-medium text-gray-600">Total Countries</p>
              <p className="text-2xl font-bold text-slate-800">
                {buyers.length}
              </p>
          </div>
        </div> */}
      </div>

      {/* Table Section */}
      <div className="premium-card shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <colgroup>
              <col style={{ width: '45%' }} />
              <col style={{ width: '45%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="">
              <tr>
                {[
                  { key: 'country', label: 'Country Name' },
                  { key: 'short_code', label: 'Short Code' },
                  { key: 'actions', label: 'Actions' }
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-200"
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.key !== 'actions' && <SortIcon field={column.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="premium-card divide-y divide-gray-200">
              {sortedBuyers.length > 0 ? (
                sortedBuyers.map((buyer) => (
                  <tr key={buyer.id} className="hover: transition duration-200">
                    <td className="px-6 py-4 break-words">
                      <div className="">
                        <div className="text-sm text-slate-800">{buyer.country}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 break-words">
                      <div className="text-sm text-slate-800">{buyer.short_code}</div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(buyer)}
                          className="text-blue-600 hover:text-blue-900 transition duration-200 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(buyer.id)}
                          className="text-red-600 hover:text-red-900 transition duration-200 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-lg font-medium">Nothing found</p>
                      <p className="mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default Country;
