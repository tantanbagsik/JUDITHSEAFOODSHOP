'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Video, 
  Upload, 
  X, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Link as LinkIcon,
  Film,
  Loader2,
  Check,
  AlertCircle,
  Search,
  Grid,
  List,
  Clock
} from 'lucide-react';

interface VideoClip {
  _id: string;
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  type: 'upload' | 'url';
  createdAt: string;
}

export default function VideosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoClip | null>(null);
  
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    type: 'url' as 'url' | 'upload',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.storeId) {
      fetchVideos();
    }
  }, [session]);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/videos?storeId=${session?.user?.storeId}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const videoFiles = fileArray.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      alert('Please upload video files only');
      return;
    }

    setUploading(true);

    try {
      for (const file of videoFiles) {
        const reader = new FileReader();
        
        const videoData = await new Promise<{ url: string; title: string }>((resolve) => {
          reader.onload = async (e) => {
            const result = e.target?.result as string;
            resolve({
              url: result,
              title: file.name.replace(/\.[^/.]+$/, ''),
            });
          };
          reader.readAsDataURL(file);
        });

        await createVideo({
          url: videoData.url,
          title: videoData.title,
          type: 'upload',
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const createVideo = async (videoData?: { url: string; title: string; type: 'url' | 'upload' }) => {
    try {
      const dataToSend = videoData || {
        url: formData.url,
        title: formData.title,
        description: formData.description,
        type: formData.type,
      };

      const res = await fetch(`/api/stores/${session?.user?.storeId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        const newVideo = await res.json();
        setVideos([newVideo, ...videos]);
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create video:', error);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/videos?videoId=${videoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setVideos(videos.filter(v => v._id !== videoId));
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      title: '',
      description: '',
      type: 'url',
    });
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(search.toLowerCase()) ||
    video.description?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            Video Clips
          </h1>
          <p className="text-gray-500 mt-1">{videos.length} video{videos.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Video
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        
        {uploading ? (
          <div className="py-4">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
            <p className="mt-2 text-gray-600">Uploading videos...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-gray-700 font-medium">Drop video files here or click to upload</p>
            <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI up to 100MB</p>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Select Files
            </button>
          </>
        )}
      </div>

      {/* Videos Grid/List */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-500 mb-4">Upload your first video or add a YouTube/Vimeo link</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Video
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div key={video._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all">
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail || getYouTubeThumbnail(video.url) ? (
                  <img 
                    src={video.thumbnail || getYouTubeThumbnail(video.url)!} 
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setPreviewVideo(video)}
                    className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <Play className="h-6 w-6 text-gray-800 ml-1" />
                  </button>
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteVideo(video._id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {formatDate(video.createdAt)}
                  {video.type === 'upload' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y">
          {filteredVideos.map((video) => (
            <div key={video._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                {video.thumbnail || getYouTubeThumbnail(video.url) ? (
                  <img 
                    src={video.thumbnail || getYouTubeThumbnail(video.url)!} 
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : null}
                <button
                  onClick={() => setPreviewVideo(video)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Play className="h-8 w-8 text-white ml-1" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500 truncate">{video.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{formatDate(video.createdAt)}</span>
                  {video.type === 'url' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">External</span>}
                  {video.type === 'upload' && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Uploaded</span>}
                </div>
              </div>
              <button
                onClick={() => deleteVideo(video._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Video className="h-6 w-6 text-purple-600" />
                Add Video
              </h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, or direct video URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-700 text-sm">
                  <Upload className="h-4 w-4" />
                  <span>Or drag & drop video files above</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createVideo()}
                disabled={!formData.url || !formData.title}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setPreviewVideo(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="w-full max-w-4xl">
            <video
              src={previewVideo.url}
              controls
              autoPlay
              className="w-full rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-white">
              <h3 className="text-xl font-bold">{previewVideo.title}</h3>
              {previewVideo.description && (
                <p className="text-gray-300 mt-2">{previewVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
