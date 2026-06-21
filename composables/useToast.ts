export const useToast = () => {
  const message = useState<string | null>('toast-msg', () => null)
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(msg: string, duration = 2200) {
    message.value = msg
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { message.value = null }, duration)
  }

  return { message, show }
}
