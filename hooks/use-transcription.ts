import React from "react";

export const prompts = {
    getTranscriptionsDetailVehicle: "Ubah kalimat berikut menjadi JSON berisi spesifikasi mobil bekas. Atribut yang perlu diambil:\n- judul (gabungan merek + model + tipe)\n- merek\n- model\n- tipe\n- transmisi\n- tahun\n- warna\n- bahan_bakar\n- kilometer\n- cc\n- jumlah_pintu\n- harga\n- lokasi\n- deskripsi\n- tanggal_input (boleh kosong atau gunakan waktu sekarang jika tidak disebut)\n\nJika ada data yang tidak disebut, kosongkan dengan null.\n\nContoh kalimat:\n\"Saya ingin menambahkan mobil Toyota Avanza tipe G tahun 2018, transmisi manual, warna hitam, kapasitas mesin 1300 cc, kilometer 78 ribu, bahan bakar bensin, harga 135 juta, jumlah pintu lima, lokasi Jakarta, mobil tangan pertama, pajak hidup.\"\n\nHanya balas JSON saja.",
    getTranscriptionsNopol: "Ubah kalimat berikut menjadi nomor polisi. Contoh kalimat:\n\"Nomor polisi mobil saya adalah ABC 1234.\"\n\nHanya balas nomor polisi saja. jangan ada spasi dan jangan ada simbol apapun, hanya boleh angka dan huruf besar."
};
export type PromptKey = keyof typeof prompts;

interface UseTranscriptionProps {
    prompt?: PromptKey;
}

export function useTranscription(props: UseTranscriptionProps = {}) {
    const [transcription, setTranscription] = React.useState<any | null>(null)
    const [isTranscribing, setIsTranscribing] = React.useState<boolean>(false)
    const [isRecording, setIsRecording] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null)
    const [selectedPrompt, setSelectedPrompt] = React.useState<PromptKey>(
        props.prompt || 'getTranscriptionsDetailVehicle'
    )
    
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
    const audioChunksRef = React.useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            setError(null)
            setIsRecording(true)
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                } 
            })
            
            // Clear previous chunks
            audioChunksRef.current = []
            
            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus' // Good compression and quality
            })
            
            mediaRecorderRef.current = mediaRecorder
            
            // Handle data available event
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }
            
            // Handle recording stop
            mediaRecorder.onstop = async () => {
                console.warn("Recording stopped")

                const audioBlob = new Blob(audioChunksRef.current, { 
                    type: 'audio/webm;codecs=opus' 
                })
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop())
                
                // Send to transcription using selected prompt
                await transcribeAudio(audioBlob, selectedPrompt)
            }
            
            // Start recording
            mediaRecorder.start()
            
        } catch (err) {
            setError('Failed to start recording: ' + (err as Error).message)
            setIsRecording(false)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const transcribeAudio = async (audioBlob: Blob, promptKey?: PromptKey) => {
        try {
            setIsTranscribing(true);
            setError(null);

            const promptToUse = promptKey || selectedPrompt;

            // Prepare FormData to send audio to API route
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('prompt', prompts[promptToUse]);

            const response = await fetch('/api/openai', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data: { transcription?: any; error?: string } = await response.json();
            if (data.error) {
                setError('Transcription failed: ' + data.error);
            } else {
                setTranscription(data.transcription);
            }
        } catch (err) {
            setError('Transcription failed: ' + (err as Error).message);
        } finally {
            setIsTranscribing(false);
        }
    }

    // Alternative method to transcribe from uploaded file
    const transcribeFromFile = async (file: File, promptKey?: PromptKey) => {
        try {
            setIsTranscribing(true);
            setError(null);

            const promptToUse = promptKey || selectedPrompt;

            // Prepare FormData to send file to API route
            const formData = new FormData();
            formData.append('audio', file, file.name);
            formData.append('prompt', prompts[promptToUse]);

            const response = await fetch('/api/openai', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data: { transcription?: any; error?: string } = await response.json();
            if (data.error) {
                setError('Transcription failed: ' + data.error);
            } else {
                setTranscription(data.transcription);
            }
        } catch (err) {
            setError('Transcription failed: ' + (err as Error).message);
        } finally {
            setIsTranscribing(false);
        }
    }

    const clearTranscription = () => {
        setTranscription(null)
        setError(null)
    }

    return {
        transcription,
        setTranscription,
        isTranscribing,
        isRecording,
        error,
        selectedPrompt,
        setSelectedPrompt,
        startRecording,
        stopRecording,
        transcribeAudio,
        transcribeFromFile,
        clearTranscription,
        prompts,
        promptKeys: Object.keys(prompts) as PromptKey[],
    }
}