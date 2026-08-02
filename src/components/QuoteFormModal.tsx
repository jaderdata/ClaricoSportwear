'use client';

import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type Segment = 'SPORTS' | 'CUSTOM' | 'BUSINESS';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  initialNotes?: string;
  segment?: Segment;
}

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

const SEGMENT_CONFIG: Record<Segment, { label: string; entityLabel: string; entityPlaceholder: string; eventLabel: string; eventPlaceholder: string }> = {
  SPORTS: {
    label: 'Sports',
    entityLabel: 'Academy / Team Name *',
    entityPlaceholder: 'e.g., Gracie Barra Downtown',
    eventLabel: 'Event / Deadline (Optional)',
    eventPlaceholder: 'e.g. State Championship / Aug 20',
  },
  CUSTOM: {
    label: 'Custom',
    entityLabel: 'Event / Occasion (Optional)',
    entityPlaceholder: 'e.g., Birthday Party, Family Reunion',
    eventLabel: 'Deadline (Optional)',
    eventPlaceholder: 'e.g. Party date / Aug 20',
  },
  BUSINESS: {
    label: 'Business',
    entityLabel: 'Company / Business Name *',
    entityPlaceholder: 'e.g., ABC Landscaping LLC',
    eventLabel: 'Deadline (Optional)',
    eventPlaceholder: 'e.g. Team launch date / Aug 20',
  },
};

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  isOpen,
  onClose,
  initialProductName = '',
  initialNotes = '',
  segment: initialSegment = 'SPORTS',
}) => {
  const [activeSegment, setActiveSegment] = useState<Segment>(initialSegment);
  const [fullName, setFullName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [quantity, setQuantity] = useState<number>(30);
  const [eventName, setEventName] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [notes, setNotes] = useState(
    initialNotes || (initialProductName ? `Interested in: ${initialProductName}` : '')
  );

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileError, setFileError] = useState('');
  const [dpiWarning, setDpiWarning] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);

  if (!isOpen) return null;

  // File Upload Handler
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles: File[]) => {
    setFileError('');
    setDpiWarning(false);

    if (files.length + newFiles.length > 3) {
      setFileError('Maximum 3 logo files allowed per quote request.');
      return;
    }

    const allowedExtensions = ['png', 'svg', 'pdf', 'ai', 'eps'];
    const validUploads: UploadedFile[] = [];

    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        setFileError(`Invalid file format: .${ext}. Only PNG, SVG, PDF, AI, and EPS formats are accepted.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`File too large: ${file.name}. Maximum file size is 10 MB.`);
        return;
      }

      // Check DPI warning for PNG image files
      if (file.type.startsWith('image/png') && file.size < 200 * 1024) {
        setDpiWarning(true);
      }

      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      validUploads.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl
      });
    }

    setFiles(prev => [...prev, ...validUploads]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Discount code validator
  const handleApplyDiscount = async () => {
    setDiscountError('');
    if (!discountCode.trim()) return;

    try {
      const { data } = await supabase
        .from('cs_discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (data) {
        setDiscountApplied({ code: data.code, percent: data.discount_percent });
        setDiscountError('');
      } else if (discountCode.trim().toUpperCase() === 'CLARICO10') {
        setDiscountApplied({ code: 'CLARICO10', percent: 10 });
        setDiscountError('');
      } else {
        setDiscountError('Invalid or expired discount code.');
      }
    } catch {
      // Fallback local check
      if (discountCode.trim().toUpperCase() === 'CLARICO10') {
        setDiscountApplied({ code: 'CLARICO10', percent: 10 });
        setDiscountError('');
      } else {
        setDiscountError('Invalid discount code.');
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const protocol = `CS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const uploadedUrls: string[] = [];

    // Upload logo files to Supabase Storage bucket 'academy-logos'
    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i];
      const cleanFileName = fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${protocol}/${Date.now()}_${i}_${cleanFileName}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('academy-logos')
          .upload(storagePath, fileObj.file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Storage upload notice (using filename fallback):', uploadError.message);
        }

        if (uploadData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('academy-logos')
            .getPublicUrl(uploadData.path);

          if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
          } else {
            uploadedUrls.push(fileObj.name);
          }
        } else {
          uploadedUrls.push(fileObj.name);
        }
      } catch (uploadErr) {
        console.warn('Storage upload notice (using filename fallback):', uploadErr);
        uploadedUrls.push(fileObj.name);
      }
    }

    try {
      const payload = {
        protocol,
        full_name: fullName,
        academy_name: academyName,
        email,
        whatsapp,
        quantity: Number(quantity),
        event_name: eventName || null,
        discount_code: discountApplied ? discountApplied.code : (discountCode || null),
        notes: notes || null,
        logo_urls: uploadedUrls.length > 0 ? uploadedUrls : files.map(f => f.name),
        status: 'pending',
        segment: activeSegment,
      };

      const { error } = await supabase.from('cs_quote_requests').insert(payload);

      if (error) {
        console.warn('Supabase insert notice:', error.message);
      }

      // Dispatch Transactional Email Notification
      await fetch('/api/quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Email API dispatch notice:', err));

    } catch (err) {
      console.error('Error submitting quote request:', err);
    } finally {
      setIsSubmitting(false);
      setSubmittedProtocol(protocol);
    }
  };

  const inputClasses = 'w-full touch-target px-4 py-3 rounded-control border border-border-strong bg-paper-raised text-ink placeholder-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-[15px] transition-colors';
  const labelClasses = 'block text-sm font-medium text-ink mb-1.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" ariaLabel="Request a quote">
      {submittedProtocol ? (
        <div className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto text-xl">
            ✓
          </div>

          <h2 className="font-display text-h2 text-ink">Quote Request Received!</h2>

          <p className="text-ink-muted text-[15px] max-w-md mx-auto">
            Thank you, <strong className="text-ink font-medium">{fullName}</strong>. Our custom apparel specialist is reviewing your requirements and logo files.
          </p>

          <div className="p-5 rounded-card bg-[#EEECE5] text-center">
            <span className="text-sm text-ink-muted block mb-1">Your Tracking Protocol</span>
            <span className="text-2xl font-medium text-ink tracking-wide">{submittedProtocol}</span>
          </div>

          <p className="text-sm text-ink-muted">
            We will contact you via WhatsApp (<strong className="text-ink font-medium">{whatsapp}</strong>) or email within 24 business hours with your digital mockup and final pricing.
          </p>

          <Button variant="secondary" onClick={onClose}>
            Close Window
          </Button>
        </div>
      ) : (
        <div className="p-6 sm:p-10">
          <div className="flex items-center gap-1 mb-6 border-b border-border pb-4">
            {(['SPORTS', 'CUSTOM', 'BUSINESS'] as Segment[]).map((seg) => {
              const cfg = SEGMENT_CONFIG[seg];
              const isActive = activeSegment === seg;
              return (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setActiveSegment(seg)}
                  className={`px-3 py-1.5 rounded-control text-sm transition-colors cursor-pointer ${
                    isActive ? 'text-ink font-medium bg-accent-soft' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <p className="eyebrow mb-2">Custom Quote Request</p>
            <h2 className="font-display text-h2 text-ink">
              {activeSegment === 'SPORTS' ? 'Create Your Gym Line' :
               activeSegment === 'CUSTOM' ? 'Create Your Custom Shirt' :
               'Create Your Business Apparel'}
            </h2>
            <p className="text-[15px] text-ink-muted mt-2">
              Fill out your details and upload your design. No minimum order required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g., Prof. Rafael Silva"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>{SEGMENT_CONFIG[activeSegment].entityLabel}</label>
                <input
                  type="text"
                  required={activeSegment !== 'CUSTOM'}
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                  placeholder={SEGMENT_CONFIG[activeSegment].entityPlaceholder}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rafael@academy.com"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Estimated Pieces (No min.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>{SEGMENT_CONFIG[activeSegment].eventLabel}</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  placeholder={SEGMENT_CONFIG[activeSegment].eventPlaceholder}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Drag & Drop Logo Upload Area */}
            <div>
              <label className={labelClasses}>Upload Academy Logo (PNG, SVG, PDF, AI, EPS · Max 10MB)</label>

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border border-dashed border-border-strong hover:border-accent rounded-card p-5 text-center transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  accept=".png,.svg,.pdf,.ai,.eps"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-file-input"
                />
                <label htmlFor="logo-file-input" className="cursor-pointer block">
                  <Upload className="size-5 mx-auto mb-2 text-ink-muted" strokeWidth={1.5} />
                  <span className="text-[15px] text-ink block">
                    Drag & drop your logo files here or <span className="text-accent underline font-medium">browse files</span>
                  </span>
                  <span className="text-sm text-ink-muted mt-1 block">
                    Up to 3 files. High resolution (300 DPI) recommended.
                  </span>
                </label>
              </div>

              {fileError && (
                <div className="mt-2 p-3 rounded-control bg-accent-soft text-accent text-sm">
                  {fileError}
                </div>
              )}

              {dpiWarning && (
                <div className="mt-2 p-3 rounded-control bg-[#EEECE5] text-ink-muted text-sm">
                  Notice: Low resolution detected. A higher resolution logo (300 DPI or vector) produces optimal DTF print crispness.
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((fileObj, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-control border border-border text-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {fileObj.previewUrl ? (
                          <img src={fileObj.previewUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <span className="text-sm text-ink-muted">File</span>
                        )}
                        <span className="text-ink truncate max-w-50">{fileObj.name}</span>
                        <span className="text-ink-muted text-sm">({(fileObj.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-ink-muted hover:text-accent p-1 cursor-pointer"
                      >
                        <X className="size-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount Code Input */}
            <div>
              <label className={labelClasses}>Discount Code (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  placeholder="e.g. CLARICO10"
                  className={`flex-1 ${inputClasses} uppercase`}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="touch-target px-5 rounded-control border border-border-strong text-ink text-sm font-medium cursor-pointer transition-colors hover:border-ink"
                >
                  Apply
                </button>
              </div>

              {discountApplied && (
                <div className="mt-1.5 text-sm text-success font-medium">
                  Code {discountApplied.code} applied! ({discountApplied.percent}% off)
                </div>
              )}
              {discountError && (
                <div className="mt-1.5 text-sm text-accent">
                  {discountError}
                </div>
              )}
            </div>

            <div>
              <label className={labelClasses}>Additional Notes / Placement Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Specify logo placements (e.g. Left chest, full back, right sleeve academy patch)..."
                className={inputClasses}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                  Generating Quote Protocol...
                </>
              ) : (
                <>
                  Submit Quote Request
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};
