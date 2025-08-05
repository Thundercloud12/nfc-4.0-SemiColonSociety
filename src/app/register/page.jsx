'use client';
import { useState } from 'react';

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: '',
        languagePreference: 'hi',
        // Pregnant specific
        pregnancyMonth: '',
        medications: '',
        expectedDeliveryDate: '',
        highRisk: false,
        // Family specific
        uniqueCode: '',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Prepare data based on role
            const submitData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                languagePreference: formData.languagePreference,
            };

            // Add role-specific data
            if (formData.role === 'pregnant') {
                submitData.pregnancyInfo = {
                    month: parseInt(formData.pregnancyMonth),
                    medications: formData.medications.split(',').map(med => med.trim()).filter(med => med),
                    expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
                    highRisk: formData.highRisk,
                };
            } else if (formData.role === 'family') {
                submitData.uniqueCode = formData.uniqueCode;
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(`Success: ${result.message}`);
                if (result.uniqueCode) {
                    setMessage(prev => `${prev}\nYour unique code: ${result.uniqueCode}\n${result.note}`);
                }
                // Reset form
                setFormData({
                    name: '',
                    phone: '',
                    password: '',
                    email: '',
                    role: '',
                    languagePreference: 'hi',
                    pregnancyMonth: '',
                    medications: '',
                    expectedDeliveryDate: '',
                    highRisk: false,
                    uniqueCode: '',
                });
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            setMessage('Error: Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <input
                        type="tel"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Role</option>
                        <option value="pregnant">Pregnant Woman</option>
                        <option value="family">Family Member</option>
                        <option value="asha">ASHA Worker</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language Preference
                    </label>
                    <select
                        name="languagePreference"
                        value={formData.languagePreference}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="hi">Hindi</option>
                        <option value="mr">Marathi</option>
                        <option value="gu">Gujarati</option>
                        <option value="en">English</option>
                    </select>
                </div>

                {/* Pregnant Woman Specific Fields */}
                {formData.role === 'pregnant' && (
                    <div className="space-y-4 p-4 bg-pink-50 rounded-md">
                        <h3 className="font-medium text-gray-800">Pregnancy Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pregnancy Month (1-9) *
                            </label>
                            <input
                                type="number"
                                name="pregnancyMonth"
                                value={formData.pregnancyMonth}
                                onChange={handleInputChange}
                                min="1"
                                max="9"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Medications (comma separated)
                            </label>
                            <input
                                type="text"
                                name="medications"
                                value={formData.medications}
                                onChange={handleInputChange}
                                placeholder="e.g. Iron tablets, Folic acid"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Delivery Date
                            </label>
                            <input
                                type="date"
                                name="expectedDeliveryDate"
                                value={formData.expectedDeliveryDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="highRisk"
                                    checked={formData.highRisk}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">High Risk Pregnancy</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Family Member Specific Fields */}
                {formData.role === 'family' && (
                    <div className="space-y-4 p-4 bg-green-50 rounded-md">
                        <h3 className="font-medium text-gray-800">Family Link Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unique Code from Pregnant Woman *
                            </label>
                            <input
                                type="text"
                                name="uniqueCode"
                                value={formData.uniqueCode}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter 8-character code"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ask the pregnant woman for her unique code to link your accounts
                            </p>
                        </div>
                    </div>
                )}

                {/* ASHA Worker gets no additional fields */}
                {formData.role === 'asha' && (
                    <div className="p-4 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-700">
                            As an ASHA worker, you'll receive a unique identification code after registration.
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-line ${
                    message.startsWith('Success') 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
