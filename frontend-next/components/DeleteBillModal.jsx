'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Custom delete confirmation modal matching YesBill branding
 */
export function DeleteBillModal({ isOpen, onClose, onConfirm, bill }) {
    if (!bill) return null;

    const monthLabel = bill.payload?.month || bill.year_month;
    const total = bill.total_amount ?? 0;
    const services = bill.payload?.items || [];
    const serviceCount = services.length;
    const aiModel = bill.ai_model_used || 'AI';
    const customNote = bill.payload?.customNote || bill.custom_note || null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <Trash2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Delete Bill?</h2>
                                            <p className="text-red-100 text-sm">This action cannot be undone</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Warning Alert */}
                                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-red-900 mb-1">Warning</p>
                                            <p className="text-sm text-red-700">
                                                Once deleted, this bill cannot be recovered. You'll need to regenerate it if needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bill Details */}
                                <div className="space-y-4 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Bill Details</h3>

                                        <div className="space-y-2 text-sm">
                                            {/* Month */}
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Month</span>
                                                <span className="font-semibold text-gray-900">{monthLabel}</span>
                                            </div>

                                            {/* Total Amount */}
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Total Amount</span>
                                                <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                                                    ₹{Number(total).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Services */}
                                            <div className="py-2 border-b border-gray-200">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-600">Services</span>
                                                    <span className="font-semibold text-gray-900">{serviceCount} service{serviceCount !== 1 ? 's' : ''}</span>
                                                </div>
                                                {services.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {services.map((service, index) => (
                                                            <div key={index} className="flex items-center justify-between text-xs pl-4">
                                                                <span className="text-gray-600">• {service.service}</span>
                                                                <span className="font-medium text-gray-700">₹{service.total}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bill Notes */}
                                            {customNote && (
                                                <div className="py-2 border-b border-gray-200">
                                                    <span className="text-gray-600 block mb-1">Bill Notes</span>
                                                    <p className="text-sm text-gray-800 italic bg-blue-50 rounded-lg p-2 border-l-2 border-blue-400">
                                                        "{customNote}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* AI Model */}
                                            {aiModel && (
                                                <div className="flex justify-between py-2">
                                                    <span className="text-gray-600">AI Model Used</span>
                                                    <span className="font-medium text-gray-700">{aiModel}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="flex-1 h-12 rounded-xl border-2"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirm}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Bill
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

export default DeleteBillModal;
