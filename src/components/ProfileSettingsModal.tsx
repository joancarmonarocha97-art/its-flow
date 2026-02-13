
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { X, Camera, Upload, Loader2 } from 'lucide-react';

interface Props {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdated: () => void;
}

export function ProfileSettingsModal({ user, isOpen, onClose, onProfileUpdated }: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileSize = file.size / 1024 / 1024; // MB

        if (fileSize > 5) {
            setError('File size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('File must be an image');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile Logic
            // First try to update the 'profiles' table if it exists
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // 4. Update Auth Metadata (optional but good for syncing)
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (authError) throw authError;

            onProfileUpdated();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">Profile Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                            <img
                                src={user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                        >
                            <Camera size={16} />
                        </button>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900">{user.user_metadata.full_name}</h3>
                        <p className="text-gray-500 capitalize">{user.user_metadata.role}</p>
                        <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                    </div>

                    <div className="w-full">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Change Avatar
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2">Max file size: 5MB</p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg w-full text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
