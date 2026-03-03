// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, X as XIcon, Coffee, Newspaper, Car, Utensils, Package, Bike, Home, Dumbbell, Wifi, Shirt, Droplets, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { WithTooltip } from "./ui/tooltip";

const iconComponents = {
  coffee: Coffee,
  newspaper: Newspaper,
  car: Car,
  utensils: Utensils,
  package: Package,
  bike: Bike,
  home: Home,
  dumbbell: Dumbbell,
  wifi: Wifi,
  shirt: Shirt,
  droplets: Droplets,
};

const BILLING_TYPES = ['utility', 'subscription', 'payment'];
const VISIT_BASED = 'visit_based';

const DELIVERY_TYPE_LABELS = {
  home_delivery: 'Home Delivery',
  visit_based: 'Visit-Based',
  utility: 'Utility',
  subscription: 'Subscription',
  payment: 'EMI / Loan / Rent',
};

export default function DayServicesModal({ isOpen, onClose, date, services, confirmations, onToggle, currencySymbol, paidBillsIndex = {} }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  const handleToggle = async (serviceId, currentStatus, targetStatus = null) => {
    let newStatus;

    if (targetStatus) {
      newStatus = targetStatus;
    } else {
      if (!currentStatus || currentStatus === 'pending') {
        newStatus = 'delivered';
      } else if (currentStatus === 'delivered') {
        newStatus = 'skipped';
      } else {
        newStatus = 'delivered';
      }
    }

    await onToggle(serviceId, dateKey, newStatus);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-600/10 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Services for {date.getDate()}</h2>
                <p className="text-sm text-gray-600 mt-1">{dateStr}</p>
              </div>
              <WithTooltip tip="Close" side="left">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl hover:bg-white/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </WithTooltip>
            </div>
          </div>

          {/* Services List */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-3">
              {[...services].sort((a, b) => {
                const getStatus = (service) => {
                  const conf = confirmations[`${service.id}-${dateKey}`];
                  return conf?.status;
                };
                const getPriority = (status) => {
                  if (status === 'delivered') return 3;
                  if (status === 'skipped') return 2;
                  return 1;
                };
                return getPriority(getStatus(b)) - getPriority(getStatus(a));
              }).map((service) => {
                const ServiceIcon = iconComponents[service.icon] || Package;
                const conf = confirmations[`${service.id}-${dateKey}`];
                const status = conf?.status;
                const deliveryType = service.delivery_type || 'home_delivery';
                const isBilling = BILLING_TYPES.includes(deliveryType);
                const isVisit = deliveryType === VISIT_BASED;
                const paidInfo = paidBillsIndex[service.id];
                const typeLabel = DELIVERY_TYPE_LABELS[deliveryType] || 'Service';

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-all"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <ServiceIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isBilling ? 'bg-blue-100 text-blue-700' :
                              isVisit ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {currencySymbol}{service.price}/{service.type}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons — per delivery type */}
                      {isBilling ? (
                        /* Billing: show paid status + go to bills */
                        <div className="flex items-center gap-2 flex-wrap justify-end sm:flex-nowrap flex-shrink-0 self-end sm:self-auto">
                          {paidInfo?.is_paid ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              Paid
                            </span>
                          ) : paidInfo && !paidInfo.is_paid ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold">
                              <Clock className="w-4 h-4" />
                              Unpaid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                              No bill yet
                            </span>
                          )}
                          <WithTooltip tip="Go to Bills page" side="top">
                            <button
                              onClick={() => { onClose(); navigate('/bills'); }}
                              className="!w-9 !h-9 !min-h-0 !px-0 !py-0 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 text-indigo-600" />
                            </button>
                          </WithTooltip>
                        </div>
                      ) : (
                        /* Home delivery / Visit-based: toggle buttons */
                        <div className="flex gap-2 flex-wrap sm:justify-end">
                          <WithTooltip tip={isVisit ? "Mark as visited" : "Mark as delivered"} side="top">
                            <button
                              onClick={() => handleToggle(service.id, status, 'delivered')}
                              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm ${status === 'delivered'
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                }`}
                            >
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline">{isVisit ? 'Visited' : 'Delivered'}</span>
                            </button>
                          </WithTooltip>
                          <WithTooltip tip={isVisit ? "Mark as missed" : "Mark as skipped"} side="top">
                            <button
                              onClick={() => handleToggle(service.id, status, 'skipped')}
                              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm ${status === 'skipped'
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                }`}
                            >
                              <XIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">{isVisit ? 'Missed' : 'Skipped'}</span>
                            </button>
                          </WithTooltip>
                          <WithTooltip tip="Clear status — not tracked" side="top">
                            <button
                              onClick={() => handleToggle(service.id, status, 'pending')}
                              className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm ${!status || status === 'pending'
                                ? 'bg-gray-400 text-white shadow-lg shadow-gray-400/30'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                              <div className="w-4 h-4 rounded-full border-2 border-current" />
                              <span className="hidden sm:inline">Not Tracked</span>
                            </button>
                          </WithTooltip>
                        </div>
                      )}
                    </div>

                    {/* Status Badge — only for non-billing services */}
                    {!isBilling && status && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : status === 'skipped'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {status === 'delivered'
                            ? `✓ ${isVisit ? 'Visited' : 'Delivered'}`
                            : status === 'skipped'
                              ? `✗ ${isVisit ? 'Missed' : 'Skipped'}`
                              : 'Not tracked'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
