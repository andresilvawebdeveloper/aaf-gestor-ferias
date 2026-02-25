import { supabase } from './supabaseClient';

export const employeeProvider = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return { data };
    },

    create: async (newEmp) => {
        const { data, error } = await supabase
            .from('employees')
            .insert([{
                name: newEmp.name,
                role: newEmp.role,
                totaldays: parseInt(newEmp.totaldays), // Sincronizado com a BD
                used: 0,
                color: newEmp.color
            }])
            .select();
        
        if (error) {
            console.error("Erro detalhado:", error.message);
            throw error;
        }
        return { data: data[0] };
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    }
};

export const vacationProvider = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('vacations')
            .select('*');
        if (error) throw error;
        return { data };
    },

    create: async (vacation) => {
        const { data, error } = await supabase
            .from('vacations')
            .insert([vacation])
            .select();
        
        if (error) throw error;

        const { data: emp } = await supabase
            .from('employees')
            .select('used')
            .eq('id', vacation.employee_id)
            .single();

        await supabase
            .from('employees')
            .update({ used: (emp.used || 0) + vacation.work_days })
            .eq('id', vacation.employee_id);
        
        return { data: data[0] };
    },

    delete: async (id) => {
        const { data: vac } = await supabase
            .from('vacations')
            .select('*')
            .eq('id', id)
            .single();

        if (vac) {
            const { data: emp } = await supabase
                .from('employees')
                .select('used')
                .eq('id', vac.employee_id)
                .single();

            await supabase
                .from('employees')
                .update({ used: Math.max(0, (emp.used || 0) - vac.work_days) })
                .eq('id', vac.employee_id);
        }

        const { error } = await supabase
            .from('vacations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }
};
// Adicione isto ao seu api.js atual
export const absenceProvider = {
    getAll: async () => {
        const { data, error } = await supabase.from('absences').select('*');
        if (error) throw error;
        return { data };
    },
    create: async (absence) => {
        const { data, error } = await supabase.from('absences').insert([absence]).select();
        if (error) throw error;
        return { data: data[0] };
    },
    delete: async (id) => {
        const { error } = await supabase.from('absences').delete().eq('id', id);
        if (error) throw error;
    }
};
// Adicione esta função dentro do objeto employeeProvider no seu api.js
update: async (id, updatedData) => {
    const { data, error } = await supabase
        .from('employees')
        .update({
            name: updatedData.name,
            role: updatedData.role,
            totaldays: parseInt(updatedData.totaldays),
            color: updatedData.color
        })
        .eq('id', id)
        .select();
    
    if (error) throw error;
    return { data: data[0] };
}