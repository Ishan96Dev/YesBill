// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../hooks/useUser';
import { profileService } from '../services/profileService';
import { useToast } from '../components/ui/toaster-custom';
import { User, Mail, Phone, Building, Globe, MapPin, Upload, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function ProfileSettings() {
  const { user, profile, displayName, avatarUrl } = useUser();
  const { toast } = useToast();

  // Resolve userId synchronously — no async, no locks, no timeouts
  const resolveUserId = () => user?.id || localStorage.getItem('user_id') || null;

  // Email with localStorage fallback
  const resolvedEmail = user?.email || localStorage.getItem('user_email') || '';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const profileLoadedRef = useRef(false);
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    phone: '',
    company: '',
    website: '',
    location: '',
    bio: '',
  });

  // Load profile data directly from DB — ensures fresh data even if cache is stale
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const userId = resolveUserId();
      if (!userId) return; // No user yet, effect will re-run when user loads

      try {
        // Instant populate from hook profile if available
        if (profile && !profileLoadedRef.current) {
          setFormData({
            full_name: profile.full_name || '',
            display_name: profile.display_name || '',
            phone: profile.phone || '',
            company: profile.company || '',
            website: profile.website || '',
            location: profile.location || '',
            bio: profile.bio || '',
          });
        }

        // Always fetch fresh from DB
        const freshProfile = await profileService.getProfile(userId);
        if (mounted && freshProfile) {
          profileLoadedRef.current = true;
          setFormData({
            full_name: freshProfile.full_name || '',
            display_name: freshProfile.display_name || '',
            phone: freshProfile.phone || '',
            company: freshProfile.company || '',
            website: freshProfile.website || '',
            location: freshProfile.location || '',
            bio: freshProfile.bio || '',
          });
        }
      } catch (err) {
        console.error('ProfileSettings: Failed to load profile:', err);
        // Fallback to auth metadata
        if (mounted && !profileLoadedRef.current && user?.user_metadata) {
          setFormData(prev => ({
            ...prev,
            full_name: user.user_metadata.full_name || '',
            display_name: user.user_metadata.display_name || user.user_metadata.full_name || '',
          }));
        }
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = resolveUserId();
      if (!userId) throw new Error('User session not found. Please refresh.');
      const savedProfile = await profileService.updateProfile(userId, formData);
      // Update form from returned DB row so form reflects exactly what was saved
      if (savedProfile) {
        setFormData({
          full_name: savedProfile.full_name || '',
          display_name: savedProfile.display_name || '',
          phone: savedProfile.phone || '',
          company: savedProfile.company || '',
          website: savedProfile.website || '',
          location: savedProfile.location || '',
          bio: savedProfile.bio || '',
        });
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        type: 'success',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update profile',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        type: 'error',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        type: 'error',
      });
      return;
    }

    setUploading(true);

    try {
      const userId = resolveUserId();
      if (!userId) throw new Error('User session not found. Please refresh.');
      await profileService.uploadAvatar(userId, file);

      toast({
        title: 'Avatar uploaded',
        description: 'Your profile picture has been updated.',
        type: 'success',
      });

      // Refresh page to show new avatar
      window.location.reload();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Could not upload avatar',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600 mb-8">Manage your personal information and preferences</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 pb-8 border-b border-gray-200">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-white" />
                  )}
                </label>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-600">{resolvedEmail}</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="How you want to be called"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={resolvedEmail}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
