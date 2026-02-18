// src/services/api.js completo e atualizado

const EMP_KEY = 'aaf_employees_data';
const VAC_KEY = 'aaf_vacations_data';

const getStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const employeeProvider = {
    getAll: () => {
        let employees = getStorage(EMP_KEY);
        if (employees.length === 0) {
            employees = [{ id: 1, name: 'Exemplo AAF', role: 'Administrativo', color: '#1e3a8a', totalDays: 22, used: 0 }];
            setStorage(EMP_KEY, employees);
        }
        return Promise.resolve({ data: employees });
    },
    create: (newEmp) => {
        const employees = getStorage(EMP_KEY);
        const employee = { ...newEmp, id: Date.now(), used: 0 };
        setStorage(EMP_KEY, [...employees, employee]);
        return Promise.resolve({ data: employee });
    },
    // NOVO: Atualizar Colaborador
    update: (id, updatedData) => {
        const employees = getStorage(EMP_KEY);
        const updated = employees.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp);
        setStorage(EMP_KEY, updated);
        return Promise.resolve({ success: true });
    },
    // NOVO: Eliminar Colaborador e as suas férias
    delete: (id) => {
        const employees = getStorage(EMP_KEY).filter(emp => emp.id !== id);
        const vacations = getStorage(VAC_KEY).filter(vac => vac.employee_id !== id);
        setStorage(EMP_KEY, employees);
        setStorage(VAC_KEY, vacations);
        return Promise.resolve({ success: true });
    }
};

export const vacationProvider = {
    getAll: () => Promise.resolve({ data: getStorage(VAC_KEY) }),
    create: (vacation) => {
        const vacations = getStorage(VAC_KEY);
        const newVacation = { ...vacation, id: Date.now() };
        setStorage(VAC_KEY, [...vacations, newVacation]);

        const employees = getStorage(EMP_KEY);
        const updatedEmployees = employees.map(emp => {
            if (emp.id === parseInt(vacation.employee_id)) {
                return { ...emp, used: Number(emp.used || 0) + Number(vacation.work_days) };
            }
            return emp;
        });
        setStorage(EMP_KEY, updatedEmployees);
        return Promise.resolve({ data: newVacation });
    },
    delete: (id) => {
        const vacations = getStorage(VAC_KEY);
        const vacToDelete = vacations.find(v => v.id === id);
        if (vacToDelete) {
            const employees = getStorage(EMP_KEY);
            const updatedEmployees = employees.map(emp => {
                if (emp.id === vacToDelete.employee_id) {
                    return { ...emp, used: Math.max(0, emp.used - vacToDelete.work_days) };
                }
                return emp;
            });
            setStorage(EMP_KEY, updatedEmployees);
        }
        const filtered = vacations.filter(v => v.id !== id);
        setStorage(VAC_KEY, filtered);
        return Promise.resolve({ success: true });
    }
};