import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { submitText, submitVoice, submitPhoto } from '../hooks/useApi';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

const CATEGORIES = [
  'Infrastructure', 'Education', 'Health', 'Water',
  'Sanitation', 'Transport', 'Agriculture', 'Electricity', 'Other'
];

export default function CitizenForm() {
  const [mode, setMode] = useState('text');
  const [language, setLanguage] = useState('hi');
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const resultMapRef = useRef(null);
  const resultMapObjRef = useRef(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    toast.loading('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ latitude: lat, longitude: lon });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`,
            { headers: { 'User-Agent': 'JanSevaAI/1.0' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const newState = addr.state || '';
          const newDistrict = addr.district || addr.county || '';
          const newCity = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || '';

          if (newCity) setCity(newCity);
          if (newDistrict) setDistrict(newDistrict);
          if (newState) setState(newState);

          toast.dismiss();
          toast.success('Location detected & address filled!');
        } catch (e) {
          toast.dismiss();
          toast.success('Location detected! (address lookup failed)');
        }
      },
      () => {
        toast.dismiss();
        toast.error('Could not detect location');
      }
    );
  };

  useEffect(() => {
    if (result && resultMapRef.current && location.latitude && location.longitude && !resultMapObjRef.current) {
      const timer = setTimeout(() => {
        const map = L.map(resultMapRef.current, {
          center: [location.latitude, location.longitude],
          zoom: 15,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        L.marker([location.latitude, location.longitude]).addTo(map)
          .bindPopup('Issue reported here').openPopup();
        map.invalidateSize();
        resultMapObjRef.current = map;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [result, location]);

  useEffect(() => {
    return () => {
      if (resultMapObjRef.current) {
        resultMapObjRef.current.remove();
        resultMapObjRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceSubmit(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started... Click stop when done');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceSubmit = async (audioBlob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language + '-IN');
      formData.append('citizen_name', fullName);
      formData.append('phone', phone);
      if (city) formData.append('ward', city);
      if (district) formData.append('district', district);
      if (state) formData.append('state', state);
      if (location.latitude) formData.append('latitude', location.latitude);
      if (location.longitude) formData.append('longitude', location.longitude);

      const response = await submitVoice(formData);
      setResult(response);
      toast.success('Voice submission processed!');
    } catch (error) {
      toast.error('Failed to process voice');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!textContent.trim()) {
      toast.error('Please enter your request');
      return;
    }
    setLoading(true);
    try {
      const response = await submitText({
        citizen_name: fullName,
        phone: phone,
        language,
        input_type: 'text',
        text_content: textContent,
        latitude: location.latitude,
        longitude: location.longitude,
        ward: city,
        district,
        state,
      });
      setResult(response);
      toast.success('Submission successful! Tracking ID: ' + response.id);
    } catch (error) {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!photoFile) {
      toast.error('Please select a photo');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('language', language);
      formData.append('citizen_name', fullName);
      formData.append('phone', phone);
      if (textContent) formData.append('text_content', textContent);
      if (city) formData.append('ward', city);
      if (district) formData.append('district', district);
      if (state) formData.append('state', state);
      if (location.latitude) formData.append('latitude', location.latitude);
      if (location.longitude) formData.append('longitude', location.longitude);

      const response = await submitPhoto(formData);
      setResult(response);
      toast.success('Photo submission processed!');
    } catch (error) {
      toast.error('Failed to process photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          JanSevaAI <span className="text-blue-600">जनसेवाAI</span>
        </h1>
        <p className="text-gray-600">Submit your development request to your MP</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language / भाषा
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.name})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={detectLocation}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Detect Location</span>
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact Information (Required)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                pattern="[0-9]{10}"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex space-x-2 mb-6">
          {['text', 'voice', 'photo'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m === 'text' && 'Text'}
              {m === 'voice' && 'Voice'}
              {m === 'photo' && 'Photo'}
            </button>
          ))}
        </div>

        {mode === 'text' && (
          <div>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Describe your development request..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleTextSubmit}
              disabled={loading || !textContent.trim()}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        )}

        {mode === 'voice' && (
          <div className="text-center">
            <div className="mb-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>
        )}

        {mode === 'photo' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-600">Tap to take a photo</p>
                </div>
              )}
            </button>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Add description (optional)"
              rows={2}
              className="mt-4 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handlePhotoSubmit}
              disabled={loading || !photoFile}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Submit Photo'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600 mb-2">Your request has been submitted successfully.</p>
          {result.id && (
            <p className="text-sm text-gray-500 mb-6">Tracking ID: <span className="font-mono font-medium text-gray-700">{result.id}</span></p>
          )}
          <button
            onClick={() => {
              setResult(null);
              setTextContent('');
              setPhotoPreview(null);
              setPhotoFile(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Submit Another Request
          </button>
        </div>
      )}
    </div>
  );
}
