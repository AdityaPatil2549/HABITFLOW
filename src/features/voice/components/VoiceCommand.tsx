import { type FC, useState, useEffect, useRef } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'

interface VoiceCommandProps {
  onCommand: (command: string, type: 'habit' | 'task') => void
  className?: string
}

export const VoiceCommand: FC<VoiceCommandProps> = ({ onCommand, className }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<any>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      const recog = new SpeechRecognitionAPI()
      recog.continuous = false
      recog.interimResults = true
      recog.lang = 'en-US'

      recog.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recog.onend = () => {
        setIsListening(false)
      }

      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        
        setTranscript(transcript)

        if (event.results[0].isFinal) {
          processCommand(transcript)
        }
      }

      recog.onerror = (event: any) => {
        setError(`Error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current = recog
    }
  }, [])

  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase()
    
    // Check for habit commands
    if (lowerText.includes('add habit') || lowerText.includes('create habit')) {
      const habitName = text.replace(/add habit|create habit/i, '').trim()
      if (habitName) {
        onCommand(habitName, 'habit')
      }
    }
    // Check for task commands
    else if (lowerText.includes('add task') || lowerText.includes('create task')) {
      const taskName = text.replace(/add task|create task/i, '').trim()
      if (taskName) {
        onCommand(taskName, 'task')
      }
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    return null
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant={isListening ? 'danger' : 'outline'}
        size="sm"
        onClick={toggleListening}
        className={cn(
          'relative',
          isListening && 'animate-pulse'
        )}
      >
        {isListening ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Voice
          </>
        )}
      </Button>

      {transcript && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          "{transcript}"
        </span>
      )}

      {error && (
        <span className="text-sm text-danger">{error}</span>
      )}
    </div>
  )
}
