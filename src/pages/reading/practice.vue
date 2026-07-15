<script setup>
import { useReadingSpeech } from '../../composables/audio'
import groups from './reading538words'

const normalize = value => value.trim().toLowerCase().replace(/\s+/g, ' ')

const words = groups.flatMap(group => group.words.map((entry) => {
  const [index, rawWord, types, meanings, replacements, note] = entry
  return {
    index,
    word: rawWord.replace(/\*$/, ''),
    types,
    meanings,
    replacements,
    note,
    category: group.title,
  }
}))

const ws = reactive(words.map(word => ({
  ...word,
  form: {
    word: '',
    replacements: '',
  },
  result: {
    checked: false,
    errors: [],
  },
})))

const readingSpeech = useReadingSpeech()

function play(item) {
  readingSpeech.play(item)
}

function onKeydown(event, item) {
  if (event.key === '`') {
    event.preventDefault()
    play(item)
  }
}

function check(index) {
  const current = ws[index]
  const enteredWord = normalize(current.form.word)
  const enteredReplacements = current.form.replacements
    .split(/[,，]/)
    .map(normalize)
    .filter(Boolean)

  const errors = []
  if (enteredWord !== normalize(current.word))
    errors.push(current.word)

  errors.push(...current.replacements.filter(replacement => (
    !enteredReplacements.includes(normalize(replacement))
  )))

  current.result.checked = true
  current.result.errors = errors
}

function next(index) {
  check(index)

  const nextIndex = index + 1
  if (nextIndex >= ws.length)
    return

  const nextWord = ws[nextIndex]
  play(nextWord)
  document.getElementById(`reading_input_${nextWord.index}`)?.focus()
}

function start() {
  if (ws.length < 1)
    return

  play(ws[0])
  document.getElementById(`reading_input_${ws[0].index}`)?.focus()
}
</script>

<template>
  <div>
    <div class="mt-6 items-center justify-between lg:flex">
      <div class="mb-4 lg:mb-0">
        <h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          阅读 538 考点词练习
        </h3>
        <ul class="ml-4 list-decimal text-sm font-normal text-gray-500 dark:text-gray-400">
          <li>同义替换多个词使用英文逗号 <kbd class="rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100">,</kbd> 分割</li>
          <li>点击喇叭图标或按 <kbd class="rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100">`</kbd>，依次朗读考点词、中文释义和英文同义词</li>
          <li>输入完同义词后按 Enter 检查并进入下一个词</li>
        </ul>
      </div>
      <button
        type="button"
        class="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white dark:bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        @click="start"
      >
        开始
      </button>
    </div>

    <div class="relative mt-4 overflow-x-auto">
      <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th class="w-0 px-6 py-3">
              #
            </th>
            <th class="w-0 px-6 py-3">
              类别
            </th>
            <th class="w-0 px-6 py-3">
              词性
            </th>
            <th class="w-20 px-6 py-3">
              音频
            </th>
            <th class="px-6 py-3">
              考点词/同义替换
            </th>
            <th class="px-6 py-3">
              结果
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(w, i) in ws"
            :key="w.index"
            class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <td class="px-6 py-4">
              {{ w.index }}
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              {{ w.category }}
            </td>
            <td class="px-6 py-4 italic">
              {{ w.types.join(', ') }}
            </td>
            <td class="px-6 py-4">
              <button class="i-carbon-volume-up-filled" @click="play(w)" />
            </td>
            <td
              class="flex flex-row items-center justify-start px-6 py-4"
              @keydown="onKeydown($event, w)"
            >
              <input
                :id="`reading_input_${w.index}`"
                v-model="w.form.word"
                p="x-2 y-1"
                w="150px"
                bg="transparent"
                border="~ rounded gray-200 dark:gray-700"
                outline="none active:none"
                spellcheck="false"
                type="text"
                placeholder="请输入..."
              >
              <div class="w-80 px-4">
                {{ w.meanings.join('；') }}
              </div>
              <input
                v-model="w.form.replacements"
                p="x-2 y-1"
                w="300px"
                bg="transparent"
                border="~ rounded gray-200 dark:gray-700"
                outline="none active:none"
                type="text"
                spellcheck="false"
                placeholder="请输入..."
                @keydown.enter="next(i)"
              >
            </td>
            <td class="px-6 py-4">
              <i v-if="w.result.checked && w.result.errors.length < 1" class="i-carbon-checkmark block text-green-700" />
              <p v-if="w.result.checked && w.result.errors.length > 0">
                {{ w.result.errors.join(', ') }}
              </p>
              <p v-if="w.note" class="mt-1 text-xs">
                {{ w.note }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
