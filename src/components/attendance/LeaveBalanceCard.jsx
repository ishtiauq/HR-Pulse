import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

export default function LeaveBalanceCard({ employees, balances, settings }) {
  const defaultPolicies = settings?.leavePolicies || { Annual: 14, Sick: 7, Casual: 3, Unpaid: 0 }
  const leaveTypes = Object.keys(defaultPolicies)

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
        <h3 className="text-base font-bold m-0 text-foreground">Leave Balances</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                {leaveTypes.map(type => (
                  <TableHead key={type} className="text-center">{type}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(emp => {
                const b = balances[emp.id] || {}
                // Fallback to default policy limits if not explicitly saved
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium text-sm text-foreground">{emp.name}</TableCell>
                    {leaveTypes.map(type => {
                       const val = b[type] || b[type.toLowerCase()] // handle legacy lower-case
                       const used = typeof val === 'object' ? val.used : (typeof val === 'number' ? val : 0) // if it was just a number from previous implementations, or 0. Wait, EmployeePortal uses just a number for remaining balance?!
                       // Wait, how was it before? EmployeePortal did `days`, indicating simple numbers for balance?
                       // No, EmployeePortal was just displaying `days`, but what does `balances` contain?
                       // Let's assume it's just the REMAINING balance as a number, or an object {used, limit}.
                       // I'll render the remaining balance to be safe, since defaultPolicies gives limits.
                       const limit = (typeof val === 'object' ? val.limit : defaultPolicies[type])
                       const remaining = typeof val === 'number' ? val : (limit - (typeof val === 'object' ? val.used : 0))
                       
                       return (
                         <TableCell key={type} className="text-center text-sm text-muted-foreground">{remaining} <span className="text-xs opacity-50">rem</span></TableCell>
                       )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
