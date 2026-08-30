import React, { useState } from 'react';
import { Event, EventModifier } from '../../types';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../api';
import { EventCard } from './EventCard';
import { EventCreationModal } from '../modals/EventCreationModal';
import { Plus, AlertCircle } from 'lucide-react';

interface EventsPanelProps {
  colonyId: number;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ colonyId }) => {
  const { data: events = [], isLoading, error } = useEvents(colonyId);
  const createEvent = useCreateEvent(colonyId);
  const updateEvent = useUpdateEvent(colonyId);
  const deleteEvent = useDeleteEvent(colonyId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const handleCreate = (eventData: { name: string; description: string; modifiers: EventModifier[] }) => {
    createEvent.mutate(eventData, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  const handleUpdate = (eventData: { name: string; description: string; modifiers: EventModifier[] }) => {
    if (!editingEvent) return;
    updateEvent.mutate({ eventId: editingEvent.id, data: eventData });
    setEditingEvent(null);
  };

  const handleToggleActive = (eventId: number, isActive: boolean) => {
    updateEvent.mutate({ eventId, data: { is_active: isActive } });
  };

  const handleDelete = (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent.mutate(eventId);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const getEmptyStateMessage = (filter: 'all' | 'active' | 'inactive') => {
    switch (filter) {
      case 'active':
        return 'No active events. Create one to track narrative occurrences.';
      case 'inactive':
        return 'No inactive events.';
      default:
        return 'No events yet. Create one to get started.';
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'active') return event.is_active;
    if (filter === 'inactive') return !event.is_active;
    return true;
  });

  const activeCount = events.filter((e) => e.is_active).length;
  const emptyStateMessage = getEmptyStateMessage(filter);

  // Extracted render function to avoid nested ternary complexity
  const renderEventsContent = () => {
    if (isLoading) {
      return (
        <div className="p-8 text-center text-slate-400 text-sm font-mono">
          Loading events...
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-mono text-red-300">Failed to load events</span>
        </div>
      );
    }
    if (filteredEvents.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 text-sm font-mono">
          {emptyStateMessage}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onToggleActive={handleToggleActive}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-slate-100">Colony Events</h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {activeCount} active event{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 text-xs font-mono uppercase rounded-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        {(['all', 'active', 'inactive'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded-t-xs transition-colors ${
              filter === tab
                ? 'bg-slate-800 text-cyan-300 border-l border-r border-t border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderEventsContent()}

      {/* Modal */}
      <EventCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={editingEvent ? handleUpdate : handleCreate}
        existingEvent={editingEvent}
      />
    </div>
  );
};