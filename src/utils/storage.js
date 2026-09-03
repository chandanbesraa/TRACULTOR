/**
 * LocalStorage persistence layer for TRACULATOR.
 * Provides resilient, 100% offline data storage and active timer state preservation.
 */

import { INITIAL_COMPLETED_RECORDS, INITIAL_CUSTOMERS_QUEUE } from '../constants/sampleData';

const KEYS = {
  CUSTOMERS: 'traculator_customers_v1',
  RECORDS: 'traculator_records_v1',
  ACTIVE_ID: 'traculator_active_customer_id_v1',
  ACTIVE_TIMER: 'traculator_active_timer_v1',
  SETTINGS: 'traculator_settings_v1',
};

/**
 * Initializes localStorage with clean empty data structure.
 */
export function initializeStorage() {
  try {
    if (!localStorage.getItem(KEYS.RECORDS)) {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

/**
 * Retrieves all completed job records.
 * @returns {Array}
 */
export function getCompletedRecords() {
  try {
    const data = localStorage.getItem(KEYS.RECORDS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error fetching records:', err);
    return [];
  }
}

/**
 * Saves a completed job record permanently.
 * @param {Object} newRecord 
 * @returns {Array} Updated records
 */
export function saveCompletedRecord(newRecord) {
  try {
    const records = getCompletedRecords();
    const updated = [newRecord, ...records.filter(r => r.id !== newRecord.id)];
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving completed record:', err);
    return [];
  }
}

/**
 * Updates an existing completed record.
 * @param {Object} updatedRecord 
 * @returns {Array}
 */
export function updateCompletedRecord(updatedRecord) {
  try {
    const records = getCompletedRecords();
    const updated = records.map(r => r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r);
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error updating completed record:', err);
    return [];
  }
}

/**
 * Deletes a record from history.
 * @param {string} recordId 
 * @returns {Array}
 */
export function deleteCompletedRecord(recordId) {
  try {
    const records = getCompletedRecords();
    const updated = records.filter(r => r.id !== recordId);
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting record:', err);
    return [];
  }
}

/**
 * Retrieves queued / pending customers.
 * @returns {Array}
 */
export function getCustomersQueue() {
  try {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error fetching customers queue:', err);
    return [];
  }
}

/**
 * Adds a new customer to the queue.
 * @param {Object} customer 
 * @returns {Array}
 */
export function addCustomerToQueue(customer) {
  try {
    const queue = getCustomersQueue();
    const updated = [customer, ...queue];
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error adding customer:', err);
    return [];
  }
}

/**
 * Updates a queued customer.
 * @param {Object} updatedCust 
 * @returns {Array}
 */
export function updateQueuedCustomer(updatedCust) {
  try {
    const queue = getCustomersQueue();
    const updated = queue.map(c => c.id === updatedCust.id ? { ...c, ...updatedCust } : c);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error updating queued customer:', err);
    return [];
  }
}

/**
 * Removes a customer from the queue.
 * @param {string} customerId 
 * @returns {Array}
 */
export function removeCustomerFromQueue(customerId) {
  try {
    const queue = getCustomersQueue();
    const updated = queue.filter(c => c.id !== customerId);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error removing customer from queue:', err);
    return [];
  }
}

/**
 * Active Customer ID
 */
export function getActiveCustomerId() {
  try {
    return localStorage.getItem(KEYS.ACTIVE_ID) || '';
  } catch {
    return '';
  }
}

export function setActiveCustomerId(id) {
  try {
    localStorage.setItem(KEYS.ACTIVE_ID, id);
  } catch (err) {
    console.error('Error setting active customer ID:', err);
  }
}

/**
 * Active Timer State Persistence
 */
export function getSavedTimerState() {
  try {
    const data = localStorage.getItem(KEYS.ACTIVE_TIMER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveTimerState(timerState) {
  try {
    if (!timerState) {
      localStorage.removeItem(KEYS.ACTIVE_TIMER);
    } else {
      localStorage.setItem(KEYS.ACTIVE_TIMER, JSON.stringify(timerState));
    }
  } catch (err) {
    console.error('Error saving timer state:', err);
  }
}

/**
 * Resets all local data to clean empty state.
 */
export function resetToSampleData() {
  try {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify([]));
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.removeItem(KEYS.ACTIVE_ID);
    localStorage.removeItem(KEYS.ACTIVE_TIMER);
    return true;
  } catch (err) {
    console.error('Error resetting data:', err);
    return false;
  }
}
