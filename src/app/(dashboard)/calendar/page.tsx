'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { getEventTypeColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const supabase = createClientComponentClient()

  const emptyForm = { title: '', description: '', event_date: '', end_date: '', event_type: 'academic' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchEvents() }, [currentMonth])

  async function fetchEvents() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('calendar_events')
      .select('*').gte('event_date', start).lte('event_date', end).order('event_date')
    setEvents(data ?? [])
  }

  async function addEvent() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('calendar_events').insert({ ...form, created_by: user?.id, approved: true })
    if (error) { toast.error('Failed'); return }
    toast.success('Event added'); setShowModal(false); setForm(emptyForm); fetchEvents()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()

  function getEventsForDay(day: Date) {
    return events.filter(e => isSameDay(parseISO(e.event_date), day))
  }

  const EVENT_TYPES = ['academic', 'holiday', 'sports', 'cultural', 'exam', 'other']
  const TYPE_LABELS: Record<string, string> = {
    academic: 'Academic', holiday: 'Holiday', sports: 'Sports',
    cultural: 'Cultural', exam: 'Exam', other: 'Other'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendar & Events</h2>
          <p className="text-sm text-gray-500">School calendar and upcoming events</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(t => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-2.5 h-2.5 rounded-full ${getEventTypeColor(t)}`} />
            {TYPE_LABELS[t]}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-gray-900 text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()}
                onClick={() => { setSelectedDay(day); setForm(p => ({ ...p, event_date: format(day, 'yyyy-MM-dd') })); setShowModal(true) }}
                className={`min-h-[60px] p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isToday ? 'bg-[#1e3a5f] text-white' : 'hover:bg-gray-50'
                }`}>
                <span className={`text-xs font-medium block text-center mb-1 ${
                  isToday ? 'text-white' : 'text-gray-700'
                }`}>{format(day, 'd')}</span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className={`${getEventTypeColor(e.event_type)} text-white text-xs px-1 py-0.5 rounded truncate`}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-400">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">This Month's Events</h3>
        {events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No events this month</p>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className={`w-3 h-3 rounded-full shrink-0 ${getEventTypeColor(e.event_type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{e.title}</p>
                  {e.description && <p className="text-xs text-gray-500 truncate">{e.description}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{format(parseISO(e.event_date), 'dd MMM')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Add Event</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))} className="input">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="input h-16 resize-none" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={addEvent} className="btn-primary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
