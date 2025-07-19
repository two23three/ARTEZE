// src/components/UI/UploadProgress.jsx 
import React from 'react';
import { CheckCircle, AlertCircle, Loader, Upload, Image, Database } from 'lucide-react';

export default function UploadProgress({ 
  isVisible, 
  currentStage, 
  progress, 
  filename, 
  error, 
  onClose 
}) {
  if (!isVisible) return null;

  const stages = [
    { 
      id: 'upload', 
      label: 'Uploading Original', 
      icon: Upload,
      description: 'Securely storing your artwork...'
    },
    { 
      id: 'process', 
      label: 'Processing Images', 
      icon: Image,
      description: 'Creating web and thumbnail versions...'
    },
    { 
      id: 'database', 
      label: 'Updating Records', 
      icon: Database,
      description: 'Saving artwork information...'
    },
    { 
      id: 'complete', 
      label: 'Complete', 
      icon: CheckCircle,
      description: 'Your artwork is ready!'
    }
  ];

  const getStageStatus = (stageId) => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    const currentIndex = stages.findIndex(s => s.id === currentStage);
    
    if (error) return 'error';
    if (stageIndex < currentIndex) return 'complete';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'rgba(20, 20, 20, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            {error ? 'Upload Failed' : 'Processing Artwork'}
          </h2>
          
          <div style={{
            fontSize: '0.9rem',
            opacity: 0.7,
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {filename}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                Upload Error
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Progress Stages */}
        <div style={{ marginBottom: '24px' }}>
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: index < stages.length - 1 ? '20px' : '0',
                opacity: status === 'pending' ? 0.5 : 1
              }}>
                {/* Stage Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 
                    status === 'complete' ? 'rgba(16, 185, 129, 0.2)' :
                    status === 'active' ? 'rgba(59, 130, 246, 0.2)' :
                    status === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                    'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${
                    status === 'complete' ? '#10b981' :
                    status === 'active' ? '#3b82f6' :
                    status === 'error' ? '#ef4444' :
                    'rgba(255, 255, 255, 0.2)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {status === 'active' ? (
                    <Loader 
                      size={20} 
                      color="#3b82f6"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  ) : status === 'error' ? (
                    <AlertCircle size={20} color="#ef4444" />
                  ) : (
                    <Icon 
                      size={20} 
                      color={
                        status === 'complete' ? '#10b981' :
                        status === 'active' ? '#3b82f6' :
                        'rgba(255, 255, 255, 0.5)'
                      }
                    />
                  )}
                </div>

                {/* Stage Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 
                      status === 'complete' ? '#10b981' :
                      status === 'active' ? '#3b82f6' :
                      status === 'error' ? '#ef4444' :
                      'rgba(255, 255, 255, 0.7)'
                  }}>
                    {stage.label}
                  </div>
                  
                  <div style={{
                    fontSize: '0.85rem',
                    opacity: 0.7
                  }}>
                    {stage.description}
                  </div>
                </div>

                {/* Progress Indicator */}
                {status === 'active' && progress > 0 && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#3b82f6',
                    fontWeight: '500',
                    minWidth: '45px',
                    textAlign: 'right'
                  }}>
                    {Math.round(progress)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        {!error && currentStage !== 'complete' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
              borderRadius: '8px'
            }} />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {error && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}

          {currentStage === 'complete' && (
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          )}
        </div>

        {/* Spinning Animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}