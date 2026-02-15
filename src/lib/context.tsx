'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

// DTOs
export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    salaryBase: string; // Monthly salary
    overtimeRate: string; // Hourly overtime rate
    address: string;
    dni: string;
    password?: string;
    status: 'Activo' | 'En Obra' | 'Inactivo';
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
    timeLimit: number; // in minutes
    assignedTo: string[]; // employee IDs
    status: 'Pendiente' | 'En Progreso' | 'Completada' | 'Validada';
    startDate?: string;
    completedDate?: string;
    actualTime?: number; // actual minutes taken
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
    progress: number; // 0 to 100
    description: string;
    tasks: WorkTask[]; // Specialized for tracking rewards and execution
    assignedEmployees: string[]; // Employee IDs
    photos: ProjectPhoto[];
    totalBudget: number;
    totalCosts: number;
    paymentStatus: 'Pendiente' | 'Señal Pagada' | 'Totalmente Pagado';
    paidAmount: number;
    digitalSignature?: string; // Base64 signature
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
    assignedTo: string; // Employee ID or 'all'
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
    clientName: string; // for display
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
    budgetId?: string; // Link to the originating budget
    status: 'Emitida' | 'Pagada' | 'Anulada';
    dueDate: string;
}

export interface EmployeeRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    type: 'Vacaciones' | 'Gasto' | 'Material' | 'Otro';
    date: string; // When the request was made
    requestedDate?: string; // e.g. for vacations
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

    currentUser: { email: string; role: 'super-admin' | 'admin' | 'employee' | 'unassigned' } | null;
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, metadata?: any) => Promise<boolean>;
    recoverPassword: (email: string) => Promise<void>;

    requests: EmployeeRequest[];
    addRequest: (data: Omit<EmployeeRequest, 'id' | 'status'>) => Promise<void>;
    updateRequest: (id: string, data: Partial<EmployeeRequest>) => Promise<void>;

    timeEntries: TimeEntry[];
    addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_EMPLOYEES: Employee[] = [
    { id: '1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@demo.com', phone: '600111222', role: 'Pintor Jefe', salaryBase: '1600', overtimeRate: '15', address: 'Calle Mayor 1', dni: '12345678A', status: 'Activo' },
    { id: '2', firstName: 'Carlos', lastName: 'López', email: 'carlos@demo.com', phone: '600333444', role: 'Ayudante', salaryBase: '1200', overtimeRate: '10', address: 'Av. Diagonal 20', dni: '87654321B', status: 'En Obra' },
    { id: '3', firstName: 'Thiago', lastName: 'Siebra Vilanova', email: 'vilanovaservicios@icloud.com', phone: '600000000', role: 'Gerente Operativo', salaryBase: '3000', overtimeRate: '25', address: 'Edificio Vilanova', dni: '11122233Z', status: 'Activo' },
];

const MOCK_TASKS: CalendarTask[] = [
    { id: 't1', type: 'observacion', title: 'Aviso General: Revisión de EPIs', date: '2026-01-06', assignedTo: 'all', isGlobal: true, note: 'Todos devem revisar seus equipamentos de segurança.', status: 'Pendiente' },
    { id: 't2', type: 'visita', title: 'Visita Técnica: Cliente Vilanova', date: '2026-01-06', assignedTo: '1', address: 'Calle Falsa 123, Madrid', note: 'Revisar infiltração na sala principal.', status: 'Pendiente' },
    { id: 't3', type: 'obra', title: 'Pintura Externa: Edifício Sol', date: '2026-01-06', assignedTo: '1', workId: 'w1', note: 'Segunda demão na fachada norte.', status: 'Pendiente' }
];

const MOCK_WORKS: Work[] = [
    {
        id: 'w1',
        title: 'Pintura Integral Edificio Sol',
        clientId: 'c1',
        budgetId: 'b1',
        startDate: '2026-01-05',
        endDate: '2026-02-15',
        status: 'En Progreso',
        progress: 35,
        description: 'Pintura de fachada y zonas comunes del edificio.',
        tasks: [
            { id: 'wt1', title: 'Fachada Norte', description: 'Limpieza y primera mano', quantity: 1, rate: 1200, iva: 21, points: 5, timeLimit: 120, assignedTo: ['1'], status: 'En Progreso' },
            { id: 'wt2', title: 'Fachada Sur', description: 'Limpieza y primera mano', quantity: 1, rate: 1200, iva: 21, points: 5, timeLimit: 120, assignedTo: ['2'], status: 'Pendiente' }
        ],
        assignedEmployees: ['1', '2'],
        photos: [],
        totalBudget: 4500,
        totalCosts: 800,
        paymentStatus: 'Señal Pagada',
        paidAmount: 2250
    }
];

const MOCK_SERVICES: Service[] = [
    {
        id: '1',
        title: 'Pintura de Habitación hasta 15m2',
        description: 'El trabajo incluye pintura acrílica mate, empapelado de suelo, encintado de marcos y ventanas, y dos manos de pintura en color a elegir.',
        defaultRate: 450,
        defaultIva: 21,
        subTasks: [
            { title: 'Empapelado y Protección', points: 1, timeLimit: 20 },
            { title: 'Pintura Techo (2 manos)', points: 2, timeLimit: 45 },
            { title: 'Pintura Paredes (2 manos)', points: 3, timeLimit: 90 },
            { title: 'Limpieza Final', points: 1, timeLimit: 15 }
        ]
    },
    {
        id: '4',
        title: 'Saneado y Pintura de Baño hasta 10m2',
        description: 'Servicio completo de saneamiento y pintura para baños pequeños.',
        defaultRate: 380,
        defaultIva: 21,
        subTasks: [
            { title: 'Empapelado de suelo', points: 1, timeLimit: 15 },
            { title: 'Encintado del perimetro y sellado', points: 1, timeLimit: 20 },
            { title: 'Rascado y Saneado de parches', points: 2, timeLimit: 40 },
            { title: 'Lijado mecanizado sin polvo', points: 2, timeLimit: 30 },
            { title: 'Imprimacion con fijador acrlico', points: 1, timeLimit: 25 },
            { title: 'Aplicacion de 2 capas pintura Blanca', points: 3, timeLimit: 60 },
            { title: 'Limpieza y entrega de obra', points: 1, timeLimit: 15 }
        ]
    }
];

const MOCK_REQUESTS: EmployeeRequest[] = [
    {
        id: 'r1',
        employeeId: '1',
        employeeName: 'Juan Pérez',
        type: 'Vacaciones',
        date: '2026-01-07',
        requestedDate: '2026-02-15',
        description: 'Solicitud de vacaciones para viaje familiar.',
        status: 'Pendiente'
    },
    {
        id: 'r2',
        employeeId: '2',
        employeeName: 'Carlos López',
        type: 'Gasto',
        date: '2026-01-08',
        amount: 45.50,
        description: 'Compra de rodillos extra para obra Edificio Sol.',
        status: 'Pendiente'
    }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [works, setWorks] = useState<Work[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stock, setStock] = useState<StockItem[]>([]);
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
    const [requests, setRequests] = useState<EmployeeRequest[]>(MOCK_REQUESTS);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [settings, setSettings] = useState<CompanySettings>({
        companyName: 'Vilanova Pinturas',
        nif: 'B12345678',
        address: '',
        phone: '',
        logoUrl: '',
        adminEmail: 'admin@vilanova.com',
        adminPassword: 'admin',
        activitySector: 'Pintura y Reformas',
        employeeCount: '0',
        defaultPaymentInstructions: 'Transferencia Bancaria a favor de Thiago Siebra Vilanova',
        defaultComments: 'De acuerdo con lo establecido en el artículo 13 del RGPD...',
        defaultTerms: 'Plazo de ejecución garantizado por fabricante y mano de obra con 24 meses de garantía...',
        currency: 'EUR',
        notifications: true,
        darkMode: true,
        nextBudgetNumber: 1000,
        nextInvoiceNumber: 1000,
        inventoryCategories: ['Pintura', 'Herramientas', 'Disolventes', 'EPIs', 'Varios']
    });
    const [currentUser, setCurrentUser] = useState<{ email: string; role: 'super-admin' | 'admin' | 'employee' | 'unassigned' } | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const savedInvoices = localStorage.getItem('go_invoices');
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

        const savedEmployees = localStorage.getItem('go_employees');
        const savedClients = localStorage.getItem('go_clients');
        const savedWorks = localStorage.getItem('go_works');
        const savedExpenses = localStorage.getItem('go_expenses');
        const savedStock = localStorage.getItem('go_stock');
        const savedTasks = localStorage.getItem('go_tasks');
        const savedSettings = localStorage.getItem('go_settings');
        const savedBudgets = localStorage.getItem('go_budgets');
        const savedServices = localStorage.getItem('go_services');
        const savedTimeEntries = localStorage.getItem('go_timeentries');
        const savedUser = localStorage.getItem('go_user');

        if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
        else setEmployees(MOCK_EMPLOYEES);

        if (savedClients) setClients(JSON.parse(savedClients));
        if (savedWorks) setWorks(JSON.parse(savedWorks));
        else setWorks(MOCK_WORKS);

        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedStock) setStock(JSON.parse(savedStock));

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(MOCK_TASKS);

        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            // Merge with defaults for new fields
            setSettings(prev => ({ ...prev, ...parsedSettings }));
        }
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));

        if (savedServices) setServices(JSON.parse(savedServices));
        else setServices(MOCK_SERVICES);

        if (savedTimeEntries) setTimeEntries(JSON.parse(savedTimeEntries));

        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        setIsInitialized(true);
    }, []);

    // Sync to LocalStorage
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('go_employees', JSON.stringify(employees));
        localStorage.setItem('go_clients', JSON.stringify(clients));
        localStorage.setItem('go_works', JSON.stringify(works));
        localStorage.setItem('go_expenses', JSON.stringify(expenses));
        localStorage.setItem('go_stock', JSON.stringify(stock));
        localStorage.setItem('go_tasks', JSON.stringify(tasks));
        localStorage.setItem('go_settings', JSON.stringify(settings));
        localStorage.setItem('go_budgets', JSON.stringify(budgets));
        localStorage.setItem('go_invoices', JSON.stringify(invoices));
        localStorage.setItem('go_services', JSON.stringify(services));
        localStorage.setItem('go_timeentries', JSON.stringify(timeEntries));
        if (currentUser) localStorage.setItem('go_user', JSON.stringify(currentUser));
        else localStorage.removeItem('go_user');
    }, [employees, clients, works, expenses, stock, tasks, settings, budgets, invoices, services, currentUser, isInitialized]);

    // --- SUPABASE SYNC LOGIC ---
    useEffect(() => {
        const updateAuthState = async (user: any) => {
            if (user) {
                const email = user.email?.toLowerCase().trim() || '';
                const metadata = user.user_metadata || {};

                let detectedRole: 'super-admin' | 'admin' | 'employee' | 'unassigned' = 'unassigned';

                // 1. Check Super Admin
                if (email === 'thiago@gestor.vilanovapinturas.es') {
                    console.log('!!! MASTER SUPER ADMIN DETECTED !!!', email);
                    setCurrentUser({ email, role: 'super-admin' });
                    return;
                }

                // 2. Check Hardcoded Admins (Backwards compatibility)
                if (
                    email === 'vilanovapinturas85@gmail.com' ||
                    email === 'thiago.siebra@vilanovadigital.com' ||
                    email.includes('admin@')
                ) {
                    console.log('!!! FORCE ADMIN DETECTED !!!', email);
                    setCurrentUser({ email, role: 'admin' });
                    return;
                }

                // 3. Check Metadata
                const metaAdmin = metadata.user_role === 'admin' || metadata.is_company === true;

                // 4. Check Employee List
                const listEmp = employees.some(e => e.email?.toLowerCase().trim() === email);

                if (metaAdmin) {
                    detectedRole = 'admin';
                } else if (listEmp) {
                    detectedRole = 'employee';
                }

                console.log('[AUTH_DEBUG]', {
                    email,
                    isSuperAdmin: email === 'thiago@gestor.vilanovapinturas.es',
                    metaAdmin,
                    listEmp,
                    assignedRole: detectedRole
                });

                setCurrentUser({
                    email,
                    role: detectedRole
                });
            } else {
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
            // Employees
            const { data: empData } = await supabase.from('employees').select('*');
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
                if (mapped.length > 0) setEmployees(mapped);
            }
            // Clients
            const { data: cliData } = await supabase.from('clients').select('*');
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
                if (mappedClients.length > 0) setClients(mappedClients);
            }

            // Works
            const { data: workData } = await supabase.from('works').select('*');
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
                    tasks: [],
                    assignedEmployees: [],
                    photos: []
                }));
                if (mappedWorks.length > 0) setWorks(mappedWorks as any);
            }

            // Time Entries
            const { data: teData } = await supabase.from('time_entries').select('*');
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
            const { data: budgetData } = await supabase.from('budgets').select('*');
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
                if (mappedBudgets.length > 0) setBudgets(mappedBudgets as any);
            }

            // Invoices
            const { data: invData } = await supabase.from('invoices').select('*');
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
                if (mappedInvoices.length > 0) setInvoices(mappedInvoices as any);
            }

            // Expenses
            const { data: expData } = await supabase.from('expenses').select('*');
            if (expData) {
                const mappedExpenses = expData.map((e: any) => ({
                    id: e.id,
                    workId: e.work_id,
                    date: e.date,
                    description: e.description,
                    category: e.category,
                    amount: e.amount
                }));
                if (mappedExpenses.length > 0) setExpenses(mappedExpenses as any);
            }

            // Tasks
            const { data: taskData } = await supabase.from('tasks').select('*');
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
                if (mappedTasks.length > 0) setTasks(mappedTasks as any);
            }

            // Services
            const { data: servData } = await supabase.from('services').select('*');
            if (servData) {
                const mappedServices = servData.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    defaultRate: s.default_rate,
                    defaultIva: s.default_iva,
                    subTasks: s.sub_tasks
                }));
                if (mappedServices.length > 0) setServices(mappedServices as any);
            }

            // Providers
            const { data: provData } = await supabase.from('providers').select('*');
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
                if (mappedProviders.length > 0) setProviders(mappedProviders);
            }

            // Requests
            const { data: reqData } = await supabase.from('requests').select('*');
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
                if (mappedRequests.length > 0) setRequests(mappedRequests as any);
            }
            // Settings
            const { data: settData } = await supabase.from('settings').select('*').single();
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
            status: data.status
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

        await supabase.from('employees').update(updateData).eq('id', id);
    };

    const deleteEmployee = async (id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        await supabase.from('employees').delete().eq('id', id);
    };

    const addClient = async (data: Omit<Client, 'id'>) => {
        const id = crypto.randomUUID();
        const newClient = { ...data, id };
        setClients(prev => [...prev, newClient]);

        await supabase.from('clients').insert([{
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            nif: data.nif,
            contact_person: data.contactPerson,
            city: data.city,
            status: data.status
        }]);

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

        await supabase.from('works').insert([{
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
            signature_data: data.digitalSignature
        }]);

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
            amount: data.amount
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

        await supabase.from('tasks').insert([{
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
            status: (data as any).status || 'Pendiente'
        }]);
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

        const updateData: any = {};
        if (data.companyName) updateData.company_name = data.companyName;
        if (data.nif) updateData.nif = data.nif;
        if (data.address) updateData.address = data.address;
        if (data.phone) updateData.phone = data.phone;
        if (data.nextBudgetNumber !== undefined) updateData.next_budget_number = data.nextBudgetNumber;
        if (data.nextInvoiceNumber !== undefined) updateData.next_invoice_number = data.nextInvoiceNumber;
        if (data.inventoryCategories) updateData.inventory_categories = data.inventoryCategories;

        await supabase.from('settings').update(updateData).eq('id', '1');
    };

    const addBudget = async (data: Omit<Budget, 'id' | 'number'>) => {
        const id = crypto.randomUUID();
        const number = settings.nextBudgetNumber.toString().padStart(6, '0');
        const newBudget = { ...data, id, number } as Budget;

        setBudgets(prev => [...prev, newBudget]);
        setSettings(prev => ({ ...prev, nextBudgetNumber: prev.nextBudgetNumber + 1 }));

        await supabase.from('budgets').insert([{
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
            status: data.status
        }]);

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
        const willBeAccepted = data.status === 'Aceptado' && currentBudget?.status !== 'Aceptado';

        if (willBeAccepted) {
            const budget = { ...currentBudget, ...data } as Budget;
            const workExists = works.find(w => w.budgetId === id);

            if (!workExists) {
                const totalBudget = budget.items.reduce((sum, item) => sum + (item.quantity * item.rate * (1 + item.iva / 100)), 0);

                newWorkIdToCalendar = await addWork({
                    title: `Obra: ${budget.concept}`,
                    clientId: budget.clientId || 'new-client',
                    budgetId: budget.id,
                    startDate: budget.plannedStartDate || new Date().toISOString().split('T')[0],
                    endDate: '',
                    status: 'Pendiente',
                    progress: 0,
                    description: `Obra generada desde presupuesto ${budget.number}`,
                    tasks: generateWorkTasks(budget.items),
                    assignedEmployees: [],
                    photos: [],
                    totalBudget,
                    totalCosts: 0,
                    paymentStatus: 'Pendiente',
                    paidAmount: 0
                }) as string;

                // Automatically add to calendar
                addTask({
                    title: `INICIO OBRA: ${budget.concept}`,
                    date: budget.plannedStartDate || new Date().toISOString().split('T')[0],
                    type: 'obra',
                    workId: newWorkIdToCalendar,
                    description: `Comienzo automático de obra desde presupuesto ${budget.number}`,
                    assignedTo: 'all',
                    status: 'Pendiente'
                });
            }
        }

        setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
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
                status: newBudget.status
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

        await supabase.from('invoices').insert([{
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
            due_date: data.dueDate
        }]);

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
            sub_tasks: data.subTasks
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
            category: data.category
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
            return false;
        }

        return !!data.user;
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
            status: 'Pendiente'
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
            longitude: data.location?.longitude
        }]);
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
