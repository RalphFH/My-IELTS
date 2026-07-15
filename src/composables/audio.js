import { onBeforeUnmount } from 'vue'

export function useExclusiveAudio() {
  let audio = null
  let playbackId = 0

  function stop() {
    playbackId += 1

    if (!audio)
      return

    audio.pause()
    audio.currentTime = 0
    audio = null
  }

  function play(src) {
    stop()

    const currentPlaybackId = playbackId
    const nextAudio = document.createElement('audio')
    nextAudio.src = src
    audio = nextAudio

    const playPromise = nextAudio.play()
    playPromise?.catch(() => {
      if (currentPlaybackId === playbackId)
        audio = null
    })
  }

  onBeforeUnmount(stop)

  return { play, stop }
}

export function useReadingSpeech() {
  const fallbackAudio = useExclusiveAudio()
  let playbackId = 0
  let startTimer = null

  function stopSpeech() {
    playbackId += 1

    if (startTimer !== null) {
      window.clearTimeout(startTimer)
      startTimer = null
    }

    if ('speechSynthesis' in window)
      window.speechSynthesis.cancel()
  }

  function stop() {
    stopSpeech()
    fallbackAudio.stop()
  }

  function speakNext(parts, index, currentPlaybackId) {
    if (currentPlaybackId !== playbackId || index >= parts.length)
      return

    const part = parts[index]
    const utterance = new SpeechSynthesisUtterance(part.text)
    utterance.lang = part.lang
    utterance.rate = part.rate

    let finished = false
    const finish = () => {
      if (finished)
        return

      finished = true
      if (currentPlaybackId === playbackId)
        speakNext(parts, index + 1, currentPlaybackId)
    }

    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  }

  function play({ word, meanings = [], replacements = [] }) {
    stop()

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      fallbackAudio.play(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`)
      return
    }

    const currentPlaybackId = playbackId
    const parts = [
      { text: `${word}.`, lang: 'en-US', rate: 0.85 },
      { text: meanings.length > 0 ? `${meanings.join('；')}。` : '', lang: 'zh-CN', rate: 0.9 },
      { text: replacements.join(', '), lang: 'en-US', rate: 0.85 },
    ].filter(part => part.text)

    // Give cancel() a moment to stop the previous system voice before starting again.
    startTimer = window.setTimeout(() => {
      startTimer = null
      speakNext(parts, 0, currentPlaybackId)
    }, 50)
  }

  onBeforeUnmount(stopSpeech)

  return { play, stop }
}
