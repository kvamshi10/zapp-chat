import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import {
  ArrowLeftIcon,
  CameraIcon,
  PencilIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../utils/api';
import UserAvatar from '../components/UserAvatar';
import toast from 'react-hot-toast';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuthStore();
  const { createChat } = useChatStore();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    status: '',
    email: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      setEditForm({
        username: currentUser?.username || '',
        status: currentUser?.status || '',
        email: currentUser?.email || ''
      });
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setProfileUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    const result = await createChat([profileUser._id], null, false);
    if (result.success) {
      navigate(`/chat/${result.chat._id}`);
    }
  };

  const handleAddContact = async () => {
    try {
      await api.post('/users/contacts/add', { userId: profileUser._id });
      toast.success('Contact added successfully');
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const handleRemoveContact = async () => {
    try {
      await api.delete(`/users/contacts/${profileUser._id}`);
      toast.success('Contact removed successfully');
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const updates = {
      username: editForm.username,
      status: editForm.status,
      email: editForm.email
    };

    if (imagePreview) {
      updates.avatar = imagePreview;
    }

    const result = await updateProfile(updates);
    if (result.success) {
      setIsEditing(false);
      setImagePreview(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImagePreview(null);
    setEditForm({
      username: profileUser?.username || '',
      status: profileUser?.status || '',
      email: profileUser?.email || ''
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-800 dark:from-gray-900 dark:to-gray-950 h-48 relative">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="p-8 text-center">
            <div className="relative inline-block">
              {isEditing && imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-900"
                />
              ) : (
                <UserAvatar 
                  user={profileUser} 
                  size="2xl"
                />
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700">
                  <CameraIcon className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {isEditing ? (
              <div className="mt-6 space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="input text-center text-xl font-bold"
                  placeholder="Username"
                />
                <input
                  type="text"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="input text-center"
                  placeholder="Status"
                  maxLength="100"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="input text-center"
                  placeholder="Email"
                />
                <div className="flex justify-center space-x-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {profileUser?.username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileUser?.status}
                </p>
                
                {/* Action Buttons */}
                <div className="mt-6 flex justify-center space-x-3">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleStartChat}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                      <button
                        onClick={currentUser?.contacts?.includes(profileUser._id) 
                          ? handleRemoveContact 
                          : handleAddContact
                        }
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        {currentUser?.contacts?.includes(profileUser._id) ? (
                          <>
                            <UserMinusIcon className="w-4 h-4" />
                            <span>Remove Contact</span>
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="w-4 h-4" />
                            <span>Add Contact</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profileUser?.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profileUser?.createdAt 
                      ? format(new Date(profileUser.createdAt), 'MMMM yyyy')
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {isOwnProfile && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistics
              </h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {currentUser?.contacts?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Contacts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    0
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Groups</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    0
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Messages</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          {isOwnProfile && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-6">
              <div className="flex justify-between">
                <button
                  onClick={() => navigate('/settings')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Account Settings →
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Privacy Settings →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
