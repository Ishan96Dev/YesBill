// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Helper to get day of week from date string
 */
const getDayOfWeek = (dateStr) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateStr);
    return days[date.getDay()];
};

/**
 * Detailed date table component showing delivered and skipped dates
 */
export function ServiceDateTable({ item }) {
    const { datesDelivered = [], datesSkipped = [], ratePerDay } = item;

    // Combine and sort all dates
    const allDates = [
        ...datesDelivered.map(date => ({ date, status: 'delivered' })),
        ...datesSkipped.map(date => ({ date, status: 'skipped' }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    if (allDates.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Day</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {allDates.map(({ date, status }, index) => (
                        <tr
                            key={index}
                            className={`border-b border-gray-200 ${status === 'delivered' ? 'bg-green-50/50' : 'bg-red-50/50'
                                }`}
                        >
                            <td className="px-3 py-2 font-medium text-gray-900">{date}</td>
                            <td className="px-3 py-2 text-gray-600">{getDayOfWeek(date)}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {status === 'delivered' ? (
                                    <span className="text-green-700">₹{ratePerDay}</span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-center">
                                {status === 'delivered' ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                        <Check className="w-3.5 h-3.5" /> Delivered
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                        <X className="w-3.5 h-3.5" /> Skipped
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                        <td colSpan="2" className="px-3 py-2 text-gray-900">Total</td>
                        <td className="px-3 py-2 text-right text-gray-900">₹{item.total}</td>
                        <td className="px-3 py-2 text-center text-xs text-gray-600">
                            {datesDelivered.length} delivered, {datesSkipped.length} skipped
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default ServiceDateTable;
