'use client';
// Updated to fix client and employee save issues

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// DTOs
export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    salaryBase: string; // Salário mensual
    overtimeRate: string; // Tasa de hora extra
    address: string;
    dni: string;
    password?: string;
    status: 'Activo' | 'En Obra' | 'Inactivo';
    photoUrl?: string;
}

export interface Client {
    id: string;
    name: string; // Razón social
    nif: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    status: 'Activo' | 'Potencial' | 'Finalizado';
}

export interface ProjectPhoto {
    id: string;
    url: string; // Base64 or mock URL
    type: 'before' | 'progress' | 'after';
    date: string;
    note?: string;
}

export interface WorkTask extends BudgetItem {
    points: number;
    timeLimit: number; // en minutos
    assignedTo: string[]; // IDs de los colaboradores
    status: 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada';
    startDate?: string;
    completedDate?: string;
    actualTime?: number; // tiempo real gastado en minutos
    photos?: ProjectPhoto[];
    budgetItemId?: string;
}

export interface Work {
    id: string;
    title: string;
    clientId: string;
    budgetId?: string;
    startDate: string;
    endDate: string;
    status: 'Pendiente' | 'En Progreso' | 'Pausado' | 'Finalizado';
    progress: number; // 0 a 100
    description: string;
    tasks: WorkTask[]; // Especializadas para seguimiento de recompensas y ejecución
    assignedEmployees: string[]; // IDs de colaboradores
    photos: ProjectPhoto[];
    totalBudget: number;
    totalCosts: number;
    paymentStatus: 'Pendiente' | 'Señal Pagada' | 'Totalmente Pagado';
    paidAmount: number;
    digitalSignature?: string; // Firma base64
}

export interface StockItem {
    id: string;
    name: string;
    category: string; // Pintura, Herramientas, Disolventes, etc.
    quantity: number;
    unit: string; // L, Kg, Unidades
    minStock: number;
    lastUpdate: string;
}

export type ExpenseCategory =
    | 'Material'
    | 'Herramientas'
    | 'Combustible'
    | 'Mano de Obra'
    | 'Comida'
    | 'Café'
    | 'Gestoría'
    | 'Préstamos'
    | 'Tarjetas'
    | 'Móvil'
    | 'Otros';

export interface Expense {
    id: string;
    workId?: string; // Optional: linked to a specific work
    date: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    receiptPhoto?: string; // Base64
    items?: { name: string; quantity: number; price: number }[];
}

export interface CompanySettings {
    companyName: string;
    nif: string;
    address: string;
    phone: string;
    logoUrl?: string; // Base64 or URL
    adminEmail: string;
    adminPassword?: string;
    activitySector: string;
    employeeCount: string;
    defaultPaymentInstructions: string;
    defaultComments: string;
    defaultTerms: string;
    currency: string;
    notifications: boolean;
    darkMode: boolean;
    // New numbering and category settings
    nextBudgetNumber: number;
    nextInvoiceNumber: number;
    inventoryCategories: string[];
}

export interface CalendarTask {
    id: string;
    type: 'obra' | 'visita' | 'observacion';
    title: string;
    date: string; // YYYY-MM-DD
    assignedTo: string; // ID del Colaborador o 'all'
    address?: string;
    workId?: string;
    note?: string;
    description?: string;
    isGlobal?: boolean;
    rewardValue?: number;
    estimatedHours?: number;
    status: 'Pendiente' | 'Completada' | 'Validada';
}

export interface BudgetItem {
    id: string;
    title: string;
    description: string;
    quantity: number;
    rate: number;
    iva: number; // percentage, e.g., 21
}

export interface Budget {
    id: string;
    number: string;
    clientId?: string;
    nonRegisteredClient?: {
        name: string;
        email: string;
        phone: string;
        address: string;
        nif: string;
    };
    clientName: string; // para visualización
    date: string;
    validity: string;
    concept: string;
    items: BudgetItem[];
    paymentInstructions: string;
    depositType: 'percentage' | 'fixed' | 'none';
    depositValue: number;
    plannedStartDate: string;
    comments: string;
    terms: string;
    status: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado';
}

export interface Invoice extends Omit<Budget, 'status' | 'validity'> {
    budgetId?: string; // Link al presupuesto de origen
    status: 'Emitida' | 'Pagada' | 'Anulada';
    dueDate: string;
}

export interface EmployeeRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    type: 'Vacaciones' | 'Gasto' | 'Material' | 'Otro';
    date: string; // Fecha de la solicitud
    requestedDate?: string; // p.ej. para vacaciones
    description: string;
    amount?: number;
    status: 'Pendiente' | 'Aprobado' | 'Rechazado';
    adminObservations?: string;
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    type: 'start' | 'pause' | 'resume' | 'stop';
    timestamp: string; // ISO string
    photo?: string; // Base64
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface Provider {
    id: string;
    name: string;
    cif: string;
    email: string;
    phone: string;
    address: string;
    category: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    defaultRate: number;
    defaultIva: number;
    subTasks?: Array<{
        title: string;
        points: number;
        timeLimit: number; // minutes
    }>;
}

interface AppContextType {
    employees: Employee[];
    addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;

    clients: Client[];
    addClient: (client: Omit<Client, 'id'>) => Promise<string> | string;
    updateClient: (id: string, data: Partial<Client>) => Promise<void> | void;

    works: Work[];
    addWork: (work: Omit<Work, 'id'>) => Promise<string> | string;
    updateWork: (id: string, data: Partial<Work>) => Promise<void> | void;
    deleteWork: (id: string) => Promise<void> | void;

    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    stock: StockItem[];
    addStockItem: (item: Omit<StockItem, 'id'>) => void;
    updateStockItem: (id: string, data: Partial<StockItem>) => void;
    deleteStockItem: (id: string) => void;

    tasks: CalendarTask[];
    addTask: (task: Omit<CalendarTask, 'id'>) => Promise<void>;
    updateTask: (id: string, data: Partial<CalendarTask>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    settings: CompanySettings;
    updateSettings: (data: Partial<CompanySettings>) => void;

    budgets: Budget[];
    addBudget: (budget: Omit<Budget, 'id' | 'number'>) => Promise<string>; // Return id
    updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
    duplicateBudget: (id: string) => Promise<string | undefined>; // Return new id
    deleteBudget: (id: string) => Promise<void>;

    invoices: Invoice[];
    addInvoice: (invoice: Omit<Invoice, 'id' | 'number'>) => Promise<string>;
    updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;

    services: Service[];
    addService: (service: Omit<Service, 'id'>) => Promise<void>;
    updateService: (id: string, data: Partial<Service>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;

    providers: Provider[];
    addProvider: (data: Omit<Provider, 'id'>) => Promise<void>;
    updateProvider: (id: string, data: Partial<Provider>) => Promise<void>;
    deleteProvider: (id: string) => Promise<void>;

    currentUser: { email: string; role: 'super-admin' | 'admin' | 'employee' | 'unassigned'; companyId?: string } | null;
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>;
    recoverPassword: (email: string) => Promise<void>;

    requests: EmployeeRequest[];
    addRequest: (data: Omit<EmployeeRequest, 'id' | 'status'>) => Promise<void>;
    updateRequest: (id: string, data: Partial<EmployeeRequest>) => Promise<void>;

    timeEntries: TimeEntry[];
    addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
    resetRanking: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_EMPLOYEES: Employee[] = [];

const MOCK_TASKS: CalendarTask[] = [];

const MOCK_WORKS: Work[] = [];

const MOCK_SERVICES: Service[] = [];

const MOCK_REQUESTS: EmployeeRequest[] = [];

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [works, setWorks] = useState<Work[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stock, setStock] = useState<StockItem[]>([]);
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [requests, setRequests] = useState<EmployeeRequest[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [settings, setSettings] = useState<CompanySettings>({
        companyName: 'Nueva Empresa',
        nif: '',
        address: '',
        phone: '',
        logoUrl: '',
        adminEmail: '',
        adminPassword: '',
        activitySector: 'Construcción y Reformas',
        employeeCount: '0',
        defaultPaymentInstructions: '',
        defaultComments: '',
        defaultTerms: '',
        currency: 'EUR',
        notifications: true,
        darkMode: true,
        nextBudgetNumber: 1,
        nextInvoiceNumber: 1,
        inventoryCategories: ['Materiales', 'Herramientas', 'EPIs', 'Varios']
    });
    const [currentUser, setCurrentUser] = useState<{ email: string; role: 'super-admin' | 'admin' | 'employee' | 'unassigned'; companyId?: string } | null>(null);
    const currentUserRef = useRef(currentUser);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load Session from LocalStorage ONLY
    useEffect(() => {
        const savedUser = localStorage.getItem('go_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        setIsInitialized(true);
    }, []);

    // Sync Session ONLY to LocalStorage + Cache Clearing
    useEffect(() => {
        if (!isInitialized) return;
        if (currentUser) {
            // Check if user has changed to avoid stale data
            const lastUserId = localStorage.getItem('go_last_user_id');
            if (lastUserId && lastUserId !== currentUser.email) {
                console.log('User changed, clearing stale local data...');
                const keysToKeep = ['go_user'];
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('go_') && !keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
            }
            localStorage.setItem('go_last_user_id', currentUser.email);
            localStorage.setItem('go_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('go_user');
            localStorage.removeItem('go_last_user_id');
        }
    }, [currentUser, isInitialized]);

    // --- SUPABASE SYNC LOGIC ---
    useEffect(() => {
        const updateAuthState = async (user: any) => {
            if (user) {
                const email = user.email?.toLowerCase().trim() || '';
                const metadata = user.user_metadata || {};

                let detectedRole: 'super-admin' | 'admin' | 'employee' | 'unassigned' = 'unassigned';

                // 1. Check Super Admin
                if (email === 'admin@master.com' || email === 'thiago@gestor.vilanovapinturas.es') {
                    console.log('!!! MASTER SUPER ADMIN DETECTED !!!', email);
                    detectedRole = 'super-admin';
                } else if (metadata.user_role === 'admin' || metadata.is_company === true) {
                    detectedRole = 'admin';
                } else if (employees.some(e => e.email?.toLowerCase().trim() === email)) {
                    detectedRole = 'employee';
                }

                const assignedRole: 'super-admin' | 'admin' | 'employee' | 'unassigned' = detectedRole as any;
                // Use metadata company or fallback to user ID for admins
                const companyId = metadata.company_id || (['admin', 'super-admin'].includes(assignedRole) ? user.id : (employees.find(e => e.email?.toLowerCase().trim() === email)?.id || metadata.company_id));

                setCurrentUser({
                    email,
                    role: assignedRole,
                    companyId
                });
            } else {
                // Guard: If we have a master admin bypass session, don't clear it just because Supabase session is null
                if (currentUserRef.current?.email === 'admin@master.com') return;
                setCurrentUser(null);
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            updateAuthState(session?.user);
        });

        // Initialize session
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateAuthState(session?.user);
        });

        return () => subscription.unsubscribe();
    }, [employees]);

    useEffect(() => {
        const fetchRemoteData = async () => {
            if (!currentUser) return;

            const companyId = currentUser.companyId;
            if (!companyId) {
                console.warn('No companyId found for user, skipping remote fetch');
                return;
            }

            // Employees
            const { data: empData } = await supabase.from('employees').select('*').eq('company_id', companyId);
            if (empData) {
                const mapped = empData.map((e: any) => ({
                    id: e.id,
                    firstName: e.first_name,
                    lastName: e.last_name,
                    email: e.email,
                    phone: e.phone,
                    role: e.role,
                    salaryBase: e.salary_base?.toString(),
                    overtimeRate: e.overtime_rate?.toString(),
                    address: e.address,
                    dni: e.dni,
                    status: e.status
                }));
                setEmployees(mapped);
            }
            // Clients
            const { data: cliData } = await supabase.from('clients').select('*').eq('company_id', companyId);
            if (cliData) {
                const mappedClients = cliData.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    address: c.address,
                    nif: c.nif,
                    contactPerson: c.contact_person || '',
                    city: c.city || '',
                    status: c.status || 'Activo'
                }));
                setClients(mappedClients);
            }

            // Works
            const { data: workData } = await supabase.from('works').select('*').eq('company_id', companyId);
            if (workData) {
                const mappedWorks = workData.map((w: any) => ({
                    id: w.id,
                    title: w.title,
                    clientId: w.client_id,
                    budgetId: w.budget_id,
                    startDate: w.start_date,
                    endDate: w.end_date,
                    status: w.status,
                    progress: w.progress,
                    description: w.description,
                    totalBudget: w.total_budget,
                    totalCosts: w.total_costs,
                    paymentStatus: w.payment_status,
                    paidAmount: w.paid_amount,
                    digitalSignature: w.signature_data,
                    tasks: w.tasks || [],
                    assignedEmployees: w.assigned_employees || [],
                    photos: w.photos || []
                }));
                setWorks(mappedWorks as any);
            }

            // Time Entries
            const { data: teData } = await supabase.from('time_entries').select('*').eq('company_id', companyId);
            if (teData) {
                const mappedEntries = teData.map((t: any) => ({
                    id: t.id,
                    employeeId: t.employee_id,
                    type: t.type,
                    timestamp: t.timestamp,
                    photo: t.photo_url,
                    location: t.latitude ? { latitude: t.latitude, longitude: t.longitude } : undefined
                }));
                if (mappedEntries.length > 0) setTimeEntries(mappedEntries);
            }

            // Budgets
            const { data: budgetData } = await supabase.from('budgets').select('*').eq('company_id', companyId);
            if (budgetData) {
                const mappedBudgets = budgetData.map((b: any) => ({
                    id: b.id,
                    number: b.number,
                    clientId: b.client_id,
                    clientName: b.client_name,
                    date: b.date,
                    validity: b.validity,
                    concept: b.concept,
                    items: b.items,
                    paymentInstructions: b.payment_instructions,
                    depositType: b.deposit_type,
                    depositValue: b.deposit_value,
                    plannedStartDate: b.planned_start_date,
                    comments: b.comments,
                    terms: b.terms,
                    status: b.status
                }));
                setBudgets(mappedBudgets as any);
            }

            // Invoices
            const { data: invData } = await supabase.from('invoices').select('*').eq('company_id', companyId);
            if (invData) {
                const mappedInvoices = invData.map((i: any) => ({
                    id: i.id,
                    number: i.number,
                    budgetId: i.budget_id,
                    clientId: i.client_id,
                    clientName: i.client_name,
                    date: i.date,
                    concept: i.concept,
                    items: i.items,
                    paymentInstructions: i.payment_instructions,
                    depositType: i.deposit_type,
                    depositValue: i.deposit_value,
                    comments: i.comments,
                    terms: i.terms,
                    status: i.status,
                    dueDate: i.due_date
                }));
                setInvoices(mappedInvoices as any);
            }

            // Expenses
            const { data: expData } = await supabase.from('expenses').select('*').eq('company_id', companyId);
            if (expData) {
                const mappedExpenses = expData.map((e: any) => ({
                    id: e.id,
                    workId: e.work_id,
                    date: e.date,
                    description: e.description,
                    category: e.category,
                    amount: e.amount
                }));
                setExpenses(mappedExpenses as any);
            }

            // Tasks
            const { data: taskData } = await supabase.from('tasks').select('*').eq('company_id', companyId);
            if (taskData) {
                const mappedTasks = taskData.map((t: any) => ({
                    id: t.id,
                    type: t.type,
                    title: t.title,
                    date: t.date,
                    assignedTo: t.assigned_to,
                    address: t.address,
                    workId: t.work_id,
                    note: t.note,
                    description: t.description,
                    isGlobal: t.is_global,
                    rewardValue: t.reward_value,
                    estimatedHours: t.estimated_hours,
                    status: t.status
                }));
                setTasks(mappedTasks as any);
            }

            // Services
            const { data: servData } = await supabase.from('services').select('*').eq('company_id', companyId);
            if (servData) {
                const mappedServices = servData.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    defaultRate: s.default_rate,
                    defaultIva: s.default_iva,
                    subTasks: s.sub_tasks
                }));
                setServices(mappedServices as any);
            }

            // Providers
            const { data: provData } = await supabase.from('providers').select('*').eq('company_id', companyId);
            if (provData) {
                const mappedProviders: Provider[] = provData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    cif: p.cif || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    address: p.address || '',
                    category: p.category || ''
                }));
                setProviders(mappedProviders);
            }

            // Requests
            const { data: reqData } = await supabase.from('requests').select('*').eq('company_id', companyId);
            if (reqData) {
                const mappedRequests = reqData.map((r: any) => ({
                    id: r.id,
                    employeeId: r.employee_id,
                    employeeName: r.employee_name || 'Empleado',
                    type: r.type,
                    description: r.description,
                    amount: r.amount,
                    date: r.date,
                    status: r.status,
                    adminObservations: r.admin_observations,
                    requestedDate: r.requested_date
                }));
                setRequests(mappedRequests as any);
            }
            // Settings
            const { data: settData } = await supabase.from('settings').select('*').eq('company_id', companyId).single();
            if (settData) {
                setSettings({
                    companyName: settData.company_name,
                    nif: settData.nif,
                    address: settData.address,
                    phone: settData.phone,
                    logoUrl: settData.logo_url,
                    adminEmail: settData.admin_email,
                    activitySector: settData.activity_sector,
                    employeeCount: settData.employee_count,
                    defaultPaymentInstructions: settData.payment_instructions,
                    defaultComments: settData.comments,
                    defaultTerms: settData.terms,
                    currency: settData.currency,
                    notifications: settData.notifications,
                    darkMode: settData.dark_mode,
                    nextBudgetNumber: settData.next_budget_number,
                    nextInvoiceNumber: settData.next_invoice_number,
                    inventoryCategories: settData.inventory_categories
                });
            }
        };

        if (isInitialized) fetchRemoteData();
    }, [isInitialized]);

    // Actions
    const addEmployee = async (data: Omit<Employee, 'id'>) => {
        const id = crypto.randomUUID();
        const newEmp = { ...data, id };
        setEmployees(prev => [...prev, newEmp]);

        // Push to Supabase
        await supabase.from('employees').insert([{
            id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            password: data.password,
            phone: data.phone,
            role: data.role,
            salary_base: parseFloat(data.salaryBase) || 0,
            overtime_rate: parseFloat(data.overtimeRate) || 0,
            address: data.address,
            dni: data.dni,
            status: data.status,
            company_id: currentUser?.companyId
        }]);
    };

    const updateEmployee = async (id: string, data: Partial<Employee>) => {
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...data } : emp));

        // Push to Supabase
        const updateData: any = {};
        if (data.firstName) updateData.first_name = data.firstName;
        if (data.lastName) updateData.last_name = data.lastName;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.role) updateData.role = data.role;
        if (data.salaryBase) updateData.salary_base = parseFloat(data.salaryBase);
        if (data.overtimeRate) updateData.overtime_rate = parseFloat(data.overtimeRate);
        if (data.status) updateData.status = data.status;
        if (data.photoUrl) updateData.photo_url = data.photoUrl;

        await supabase.from('employees').update(updateData).eq('id', id);
    };

    const deleteEmployee = async (id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        await supabase.from('employees').delete().eq('id', id);
    };

    const addClient = async (data: Omit<Client, 'id'>): Promise<string> => {
        const id = crypto.randomUUID();

        if (!currentUser?.companyId) {
            console.error('No company ID found for client creation. User:', currentUser);
            throw new Error('No se puede guardar el cliente: La sesión aún se está sincronizando o no tienes un ID de empresa asignado. Por favor, espera un momento o vuelve a iniciar sesión.');
        }

        const { error } = await supabase.from('clients').insert([{
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            nif: data.nif,
            contact_person: data.contactPerson,
            city: data.city,
            status: data.status,
            company_id: currentUser.companyId
        }]);

        if (error) {
            console.error('Supabase error creating client:', error);
            throw error;
        }

        setClients(prev => [...prev, { ...data, id } as Client]);
        return id;
    };

    const updateClient = async (id: string, data: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;
        if (data.nif) updateData.nif = data.nif;
        if (data.status) updateData.status = data.status;

        await supabase.from('clients').update(updateData).eq('id', id);
    };

    const addWork = async (data: Omit<Work, 'id'>) => {
        const id = crypto.randomUUID();
        const newWork = { ...data, id };
        setWorks(prev => [...prev, newWork]);

        const { error } = await supabase.from('works').insert([{
            id,
            title: data.title,
            client_id: data.clientId,
            budget_id: data.budgetId,
            start_date: data.startDate,
            end_date: data.endDate,
            status: data.status,
            progress: data.progress,
            description: data.description,
            total_budget: data.totalBudget,
            total_costs: data.totalCosts,
            payment_status: data.paymentStatus,
            paid_amount: data.paidAmount,
            signature_data: data.digitalSignature,
            tasks: data.tasks,
            assigned_employees: data.assignedEmployees,
            photos: data.photos,
            company_id: currentUser?.companyId
        }]);

        if (error) {
            console.error('Supabase error creating work:', error);
            throw error;
        }

        return id;
    };

    const updateWork = async (id: string, data: Partial<Work>) => {
        setWorks(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.status) updateData.status = data.status;
        if (data.progress !== undefined) updateData.progress = data.progress;
        if (data.description) updateData.description = data.description;
        if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
        if (data.paidAmount !== undefined) updateData.paid_amount = data.paidAmount;
        if (data.digitalSignature) updateData.signature_data = data.digitalSignature;
        if (data.tasks) updateData.tasks = data.tasks;
        if (data.assignedEmployees) updateData.assigned_employees = data.assignedEmployees;
        if (data.photos) updateData.photos = data.photos;

        await supabase.from('works').update(updateData).eq('id', id);
    };

    const deleteWork = async (id: string) => {
        setWorks(prev => prev.filter(w => w.id !== id));
        await supabase.from('works').delete().eq('id', id);
    };

    const addExpense = async (data: Omit<Expense, 'id'>) => {
        const id = crypto.randomUUID();
        const newExpense = { ...data, id };
        setExpenses(prev => [...prev, newExpense]);

        if (data.workId) {
            setWorks(prevWorks => prevWorks.map(w =>
                w.id === data.workId
                    ? { ...w, totalCosts: w.totalCosts + data.amount }
                    : w
            ));
            // Update total_costs in works table too
            const work = works.find(w => w.id === data.workId);
            if (work) {
                await supabase.from('works').update({
                    total_costs: (work.totalCosts || 0) + data.amount
                }).eq('id', data.workId);
            }
        }

        await supabase.from('expenses').insert([{
            id,
            work_id: data.workId,
            date: data.date,
            description: data.description,
            category: data.category,
            amount: data.amount,
            company_id: currentUser?.companyId
        }]);
    };

    const updateExpense = async (id: string, data: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));

        const updateData: any = {};
        if (data.description) updateData.description = data.description;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.category) updateData.category = data.category;

        await supabase.from('expenses').update(updateData).eq('id', id);
    };

    const deleteExpense = async (id: string) => {
        const expense = expenses.find(e => e.id === id);
        if (expense?.workId) {
            setWorks(prevWorks => prevWorks.map(w =>
                w.id === expense.workId
                    ? { ...w, totalCosts: w.totalCosts - expense.amount }
                    : w
            ));
            const work = works.find(w => w.id === expense.workId);
            if (work) {
                await supabase.from('works').update({
                    total_costs: Math.max(0, (work.totalCosts || 0) - expense.amount)
                }).eq('id', expense.workId);
            }
        }
        setExpenses(prev => prev.filter(e => e.id !== id));
        await supabase.from('expenses').delete().eq('id', id);
    };

    const addStockItem = (data: Omit<StockItem, 'id'>) => {
        const newItem = { ...data, id: crypto.randomUUID() };
        setStock(prev => [...prev, newItem]);
    };

    const updateStockItem = (id: string, data: Partial<StockItem>) => {
        setStock(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    };

    const deleteStockItem = (id: string) => {
        setStock(prev => prev.filter(item => item.id !== id));
    };

    const addTask = async (data: Omit<CalendarTask, 'id'>) => {
        const id = crypto.randomUUID();
        const newTask = { ...data, id, status: (data as any).status || 'Pendiente' };
        setTasks(prev => [...prev, newTask as CalendarTask]);

        const { error } = await supabase.from('tasks').insert([{
            id,
            type: data.type,
            title: data.title,
            date: data.date,
            assigned_to: data.assignedTo,
            address: data.address,
            work_id: data.workId,
            note: data.note,
            description: data.description,
            is_global: data.isGlobal,
            reward_value: data.rewardValue,
            estimated_hours: data.estimatedHours,
            status: (data as any).status || 'Pendiente',
            company_id: currentUser?.companyId
        }]);

        if (error) {
            console.error('Supabase error creating task:', error);
            throw error;
        }
    };

    const updateTask = async (id: string, data: Partial<CalendarTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.date) updateData.date = data.date;
        if (data.status) updateData.status = data.status;

        await supabase.from('tasks').update(updateData).eq('id', id);
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from('tasks').delete().eq('id', id);
    };

    const updateSettings = async (data: Partial<CompanySettings>) => {
        setSettings(prev => ({ ...prev, ...data }));
        if (!currentUser?.companyId) return;

        const updateData: any = {};
        if (data.companyName !== undefined) updateData.company_name = data.companyName;
        if (data.nif !== undefined) updateData.nif = data.nif;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.activitySector !== undefined) updateData.activity_sector = data.activitySector;
        if (data.nextBudgetNumber !== undefined) updateData.next_budget_number = data.nextBudgetNumber;
        if (data.nextInvoiceNumber !== undefined) updateData.next_invoice_number = data.nextInvoiceNumber;
        if (data.inventoryCategories !== undefined) updateData.inventory_categories = data.inventoryCategories;
        if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
        if (data.adminEmail !== undefined) updateData.admin_email = data.adminEmail;

        // Try to update settings for THIS company
        const { data: currentSettings } = await supabase.from('settings').select('id').eq('company_id', currentUser.companyId).limit(1).single();
        if (currentSettings) {
            await supabase.from('settings').update(updateData).eq('id', currentSettings.id);
        } else {
            // If no settings exist for this company, create them
            await supabase.from('settings').insert([{ ...updateData, company_id: currentUser.companyId }]);
        }
    };

    const createWorkFromBudget = async (budget: Budget) => {
        const workExists = works.find(w => w.budgetId === budget.id);

        if (workExists) {
            // Update existing work date if changed
            if (workExists.startDate !== budget.plannedStartDate) {
                await updateWork(workExists.id, { startDate: budget.plannedStartDate });
                // Also update calendar task
                const task = tasks.find(t => t.workId === workExists.id && t.type === 'obra');
                if (task) {
                    await updateTask(task.id, { date: budget.plannedStartDate });
                }
            }
            return workExists.id;
        }

        const totalBudget = budget.items.reduce((sum, item) => sum + (item.quantity * item.rate * (1 + item.iva / 100)), 0);

        const workId = await addWork({
            title: `Obra: ${budget.concept}`,
            clientId: budget.clientId || 'new-client',
            budgetId: budget.id,
            startDate: budget.plannedStartDate || new Date().toISOString().split('T')[0],
            endDate: '',
            status: 'Pendiente',
            progress: 0,
            description: `Obra generada automáticamente desde presupuesto ${budget.number}`,
            tasks: generateWorkTasks(budget.items),
            assignedEmployees: [],
            photos: [],
            totalBudget,
            totalCosts: 0,
            paymentStatus: 'Pendiente',
            paidAmount: 0
        }) as string;

        // Automatically add to calendar
        await addTask({
            title: `INICIO OBRA: ${budget.concept}`,
            date: budget.plannedStartDate || new Date().toISOString().split('T')[0],
            type: 'obra',
            workId: workId,
            description: `Comienzo automático de obra desde presupuesto ${budget.number}`,
            assignedTo: 'all',
            status: 'Pendiente'
        });

        return workId;
    };

    const addBudget = async (data: Omit<Budget, 'id' | 'number'>) => {
        const id = crypto.randomUUID();
        const number = settings.nextBudgetNumber.toString().padStart(6, '0');
        const newBudget = { ...data, id, number } as Budget;

        setBudgets(prev => [...prev, newBudget]);
        setSettings(prev => ({ ...prev, nextBudgetNumber: prev.nextBudgetNumber + 1 }));

        const { error } = await supabase.from('budgets').insert([{
            id,
            number,
            client_id: data.clientId,
            client_name: data.clientName,
            date: data.date,
            validity: data.validity,
            concept: data.concept,
            items: data.items,
            payment_instructions: data.paymentInstructions,
            deposit_type: data.depositType,
            deposit_value: data.depositValue,
            planned_start_date: data.plannedStartDate,
            comments: data.comments,
            terms: data.terms,
            status: data.status,
            company_id: currentUser?.companyId
        }]);

        if (error) {
            console.error('Error adding budget to Supabase:', error);
            throw error;
        }

        // Persist the new budget number in settings
        await updateSettings({ nextBudgetNumber: settings.nextBudgetNumber + 1 });

        // AUTOMATIC WORK CREATION: Only if it's accepted and has a start date
        if (data.status === 'Aceptado' && data.plannedStartDate) {
            await createWorkFromBudget(newBudget);
        }

        return id;
    };

    const generateWorkTasks = (budgetItems: BudgetItem[]) => {
        const tasks: WorkTask[] = [];

        budgetItems.forEach(item => {
            const service = services.find(s => s.title === item.title);

            if (service?.subTasks && service.subTasks.length > 0) {
                service.subTasks.forEach(st => {
                    tasks.push({
                        ...item,
                        id: crypto.randomUUID(),
                        budgetItemId: item.id,
                        title: st.title,
                        description: `Parte de: ${item.title}`,
                        points: st.points,
                        timeLimit: st.timeLimit,
                        assignedTo: [],
                        status: 'Pendiente'
                    });
                });
            } else {
                const lines = item.description.split('\n').filter(line =>
                    line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')
                );

                if (lines.length > 0) {
                    lines.forEach(line => {
                        tasks.push({
                            ...item,
                            id: crypto.randomUUID(),
                            budgetItemId: item.id,
                            title: line.trim().replace(/^[-•*]\s*/, ''),
                            description: `Tarea específica de ${item.title}`,
                            points: 1,
                            timeLimit: 30,
                            assignedTo: [],
                            status: 'Pendiente'
                        });
                    });
                } else {
                    tasks.push({
                        ...item,
                        id: crypto.randomUUID(),
                        budgetItemId: item.id,
                        points: 1,
                        timeLimit: 60,
                        assignedTo: [],
                        status: 'Pendiente'
                    });
                }
            }
        });

        return tasks;
    };

    const updateBudget = async (id: string, data: Partial<Budget>) => {
        let newWorkIdToCalendar: string | undefined;

        const currentBudget = budgets.find(b => b.id === id);
        if (!currentBudget) return;

        const updatedBudget = { ...currentBudget, ...data } as Budget;

        // AUTOMATIC WORK CREATION: Only if status is 'Aceptado'
        const isAccepted = updatedBudget.status === 'Aceptado';
        const statusChangedToAccepted = data.status === 'Aceptado' && currentBudget.status !== 'Aceptado';
        const dateChangedWhileAccepted = isAccepted && data.plannedStartDate && data.plannedStartDate !== currentBudget.plannedStartDate;

        if (statusChangedToAccepted || dateChangedWhileAccepted) {
            await createWorkFromBudget(updatedBudget);
        }

        setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

        const updateData: any = {};
        if (data.clientName) updateData.client_name = data.clientName;
        if (data.clientId) updateData.client_id = data.clientId;
        if (data.date) updateData.date = data.date;
        if (data.validity) updateData.validity = data.validity;
        if (data.concept) updateData.concept = data.concept;
        if (data.items) updateData.items = data.items;
        if (data.status) updateData.status = data.status;
        if (data.depositType) updateData.deposit_type = data.depositType;
        if (data.depositValue !== undefined) updateData.deposit_value = data.depositValue;
        if (data.plannedStartDate) updateData.planned_start_date = data.plannedStartDate;
        if (data.comments !== undefined) updateData.comments = data.comments;
        if (data.paymentInstructions) updateData.payment_instructions = data.paymentInstructions;
        if (data.terms) updateData.terms = data.terms;

        await supabase.from('budgets').update(updateData).eq('id', id);
    };

    const duplicateBudget = async (id: string) => {
        const budgetToCopy = budgets.find(b => b.id === id);
        if (budgetToCopy) {
            const newId = crypto.randomUUID();
            const number = settings.nextBudgetNumber.toString().padStart(6, '0');
            const { id: _, number: __, ...rest } = budgetToCopy;
            const newBudget = {
                ...rest,
                id: newId,
                number,
                date: new Date().toISOString().split('T')[0],
                status: 'Borrador' as const
            } as Budget;
            setBudgets(prev => [...prev, newBudget]);
            setSettings(prev => ({ ...prev, nextBudgetNumber: prev.nextBudgetNumber + 1 }));

            await supabase.from('budgets').insert([{
                id: newId,
                number,
                client_id: newBudget.clientId,
                client_name: newBudget.clientName,
                date: newBudget.date,
                validity: newBudget.validity,
                concept: newBudget.concept,
                items: newBudget.items,
                payment_instructions: newBudget.paymentInstructions,
                deposit_type: newBudget.depositType,
                deposit_value: newBudget.depositValue,
                planned_start_date: newBudget.plannedStartDate,
                comments: newBudget.comments,
                terms: newBudget.terms,
                status: newBudget.status,
                company_id: currentUser?.companyId
            }]);

            return newId;
        }
        return undefined;
    };



    const deleteBudget = async (id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
        await supabase.from('budgets').delete().eq('id', id);
    };

    const addInvoice = async (data: Omit<Invoice, 'id' | 'number'>) => {
        const id = crypto.randomUUID();
        const number = settings.nextInvoiceNumber.toString().padStart(6, '0');
        const newInvoice = { ...data, id, number } as Invoice;

        setInvoices(prev => [...prev, newInvoice]);
        setSettings(prev => ({ ...prev, nextInvoiceNumber: prev.nextInvoiceNumber + 1 }));

        const { error } = await supabase.from('invoices').insert([{
            id,
            number,
            budget_id: data.budgetId,
            client_id: data.clientId,
            client_name: data.clientName,
            date: data.date,
            concept: data.concept,
            items: data.items,
            payment_instructions: data.paymentInstructions,
            deposit_type: data.depositType,
            deposit_value: data.depositValue,
            comments: data.comments,
            terms: data.terms,
            status: data.status,
            due_date: data.dueDate,
            company_id: currentUser?.companyId
        }]);

        if (error) {
            console.error('Error adding invoice to Supabase:', error);
            throw error;
        }

        // Persist the new invoice number in settings
        await updateSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });

        return id;
    };

    const updateInvoice = async (id: string, data: Partial<Invoice>) => {
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));

        const updateData: any = {};
        if (data.status) updateData.status = data.status;

        await supabase.from('invoices').update(updateData).eq('id', id);
    };

    const deleteInvoice = async (id: string) => {
        setInvoices(prev => prev.filter(i => i.id !== id));
        await supabase.from('invoices').delete().eq('id', id);
    };

    const addService = async (data: Omit<Service, 'id'>) => {
        const id = crypto.randomUUID();
        const newService = { ...data, id };
        setServices(prev => [...prev, newService]);

        await supabase.from('services').insert([{
            id,
            title: data.title,
            description: data.description,
            default_rate: data.defaultRate,
            default_iva: data.defaultIva,
            sub_tasks: data.subTasks,
            company_id: currentUser?.companyId
        }]);
    };

    const updateService = async (id: string, data: Partial<Service>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.defaultRate !== undefined) updateData.default_rate = data.defaultRate;
        if (data.subTasks) updateData.sub_tasks = data.subTasks;

        await supabase.from('services').update(updateData).eq('id', id);
    };

    const deleteService = async (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
        await supabase.from('services').delete().eq('id', id);
    };

    const addProvider = async (data: Omit<Provider, 'id'>) => {
        const id = crypto.randomUUID();
        const newProvider = { ...data, id };
        setProviders(prev => [...prev, newProvider]);

        await supabase.from('providers').insert([{
            id,
            name: data.name,
            cif: data.cif,
            email: data.email,
            phone: data.phone,
            address: data.address,
            category: data.category,
            company_id: currentUser?.companyId
        }]);
    };

    const updateProvider = async (id: string, data: Partial<Provider>) => {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.cif) updateData.cif = data.cif;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;
        if (data.category) updateData.category = data.category;

        await supabase.from('providers').update(updateData).eq('id', id);
    };

    const deleteProvider = async (id: string) => {
        setProviders(prev => prev.filter(p => p.id !== id));
        await supabase.from('providers').delete().eq('id', id);
    };

    const login = async (email: string, password?: string) => {
        // Master Bypass for Dashboard/System Control
        if (email?.toLowerCase().trim() === 'admin@master.com' && password === 'master2026') {
            const masterUser = { email: 'admin@master.com', role: 'super-admin' as const, companyId: 'master-company-id' };
            setCurrentUser(masterUser);
            localStorage.setItem('go_user', JSON.stringify(masterUser));
            return true;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || '',
        });

        if (error) {
            console.error('Login error:', error.message);
            return false;
        }

        return !!data.user;
    };

    const signUp = async (email: string, password: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (error) {
            console.error('Signup error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: !!data.user };
    };

    const recoverPassword = async (email: string) => {
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    };

    const addRequest = async (data: Omit<EmployeeRequest, 'id' | 'status'>) => {
        const id = crypto.randomUUID();
        const newReq = { ...data, id, status: 'Pendiente' } as EmployeeRequest;
        setRequests(prev => [...prev, newReq]);

        await supabase.from('requests').insert([{
            id,
            employee_id: data.employeeId,
            employee_name: data.employeeName,
            type: data.type,
            description: data.description,
            amount: data.amount,
            date: data.date,
            status: 'Pendiente',
            company_id: currentUser?.companyId
        }]);
    };

    const updateRequest = async (id: string, data: Partial<EmployeeRequest>) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));

        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.adminObservations) updateData.admin_observations = data.adminObservations;

        await supabase.from('requests').update(updateData).eq('id', id);
    };

    const addTimeEntry = async (data: Omit<TimeEntry, 'id'>) => {
        const id = crypto.randomUUID();
        const newEntry = { ...data, id };
        setTimeEntries(prev => [...prev, newEntry]);

        await supabase.from('time_entries').insert([{
            id,
            employee_id: data.employeeId,
            type: data.type,
            timestamp: data.timestamp,
            photo_url: data.photo,
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            company_id: currentUser?.companyId
        }]);
    };

    const resetRanking = async () => {
        setTasks(prev => prev.map(t => t.status === 'Validada' ? { ...t, status: 'Archivada' as any } : t));
        await supabase.from('tasks').update({ status: 'Archivada' }).eq('status', 'Validada');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    return (
        <AppContext.Provider value={{
            employees, addEmployee, updateEmployee, deleteEmployee,
            clients, addClient, updateClient,
            works, addWork, updateWork, deleteWork,
            expenses, addExpense, updateExpense, deleteExpense,
            stock, addStockItem, updateStockItem, deleteStockItem,
            tasks, addTask, updateTask, deleteTask,
            settings, updateSettings,
            budgets, addBudget, updateBudget, duplicateBudget, deleteBudget,
            invoices, addInvoice, updateInvoice, deleteInvoice,
            services, addService, updateService, deleteService,
            providers, addProvider, updateProvider, deleteProvider,
            requests, addRequest, updateRequest,
            timeEntries, addTimeEntry,
            resetRanking,
            currentUser, login, logout, signUp, recoverPassword
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
