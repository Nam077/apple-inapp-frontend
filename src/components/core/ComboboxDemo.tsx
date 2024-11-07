import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { apiClient } from "@/utils/apiClient"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer'

// Define interfaces for AppData and Region
export interface AppData {
    url: string
    success: boolean
    data: {
        title: string
        price: string
    }[]
    name: string
    country: {
        name: string
        language: string
        countryCode: string
    }
}

const AppDataComponent: React.FC<{ appData: AppData }> = ({ appData }) => (
    <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg bg-white space-y-6 mt-6">
        <div className="text-center space-y-1">
            <a href={appData.url} target="_blank" rel="noopener noreferrer" className="text-2xl font-semibold text-blue-500 hover:underline">
                {appData.name}
            </a>
            <p className="text-gray-400 text-xs">{appData.url}</p>
        </div>

        <div className="pt-4 space-y-2">
            <h2 className="text-lg font-medium text-gray-800">Country Information</h2>
            <p className="text-gray-600"><strong>Country:</strong> {appData.country.name}</p>
            <p className="text-gray-600"><strong>Language:</strong> {appData.country.language}</p>
            <p className="text-gray-600"><strong>Country Code:</strong> {appData.country.countryCode}</p>
        </div>

        <div className="pt-4 space-y-2">
            <h2 className="text-lg font-medium text-gray-800">Plan</h2>
            {appData.data.length > 0 ? (
                <ul className="space-y-2">
                    {appData.data.map((item, index) => (
                        <li key={index} className="flex justify-between px-4 py-2 border border-gray-200 rounded-md bg-gray-100">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-gray-500">{item.price}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400">No items available.</p>
            )}
        </div>
    </div>
)

export interface Region {
    name: string
    language: string
    countryCode: string
}

const filterValidUrls = (text: string): string[] => {
    const urlRegex = /https:\/\/apps\.apple\.com\/[a-z]{2}(-[a-z]{2})?\/app\/[a-z0-9-]+\/id[0-9]+/g
    return text.match(urlRegex) || []
}

const fetchRegions = async (): Promise<Region[]> => {
    try {
        const { data } = await apiClient.get('/in-app/country-codes')
        const uniqueRegions = Array.from(new Set(data.map((region: Region) => region.countryCode)))
        return data.filter((region: Region) => uniqueRegions.includes(region.countryCode))
    } catch (error) {
        console.error(error)
        return []
    }
}

const submitUrls = async (urls: string[], countryCode: string) => {
    const getQueryInApp = (countryCode: string) => countryCode ? '?countryCode=' + countryCode : ''
    try {
        const response = await apiClient.post(`/in-app/multiple${getQueryInApp(countryCode)}`, { urls })
        return response.data
    } catch (error) {
        console.error(error)
    }
}

const formSchema = z.object({
    text: z.string().min(2, { message: "Text must be at least 2 characters." }),
})
Font.register({
    family: "Roboto",
    src:
        "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf"
});

const styles = StyleSheet.create({
    body: { fontFamily: 'Roboto', fontSize: 12 },
    header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    table: { display: 'flex', width: 'auto', marginTop: 10 },
    tableRow: { flexDirection: 'row' },
    tableCol: { width: '20%', borderStyle: 'solid', borderWidth: 1, padding: 5 },
    tableCellHeader: { fontWeight: 'bold' },
    tableCell: { fontSize: 10 },
})

const PDFDocument = ({ appDataList }: { appDataList: AppData[] }) => (
    <Document>
        <Page size="A4" style={styles.body}>
            <Text style={styles.header}>App Data</Text>
            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Tên</Text>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Quốc Gia</Text>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Ngôn Ngữ</Text>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Mã Quốc Gia</Text>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Tiêu Đề</Text>
                    <Text style={[styles.tableCol, styles.tableCellHeader]}>Giá</Text>
                </View>
                {appDataList.flatMap(app =>
                    app.data.map((d, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={styles.tableCol}>{app.name}</Text>
                            <Text style={styles.tableCol}>{app.country.name}</Text>
                            <Text style={styles.tableCol}>{app.country.language}</Text>
                            <Text style={styles.tableCol}>{app.country.countryCode}</Text>
                            <Text style={styles.tableCol}>{d.title}</Text>
                            <Text style={styles.tableCol}>{d.price}</Text>
                        </View>
                    ))
                )}
            </View>
        </Page>
    </Document>

)
export function ComboboxDemo() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [regions, setRegions] = React.useState<Region[]>([])
    const [appDataList, setAppDataList] = React.useState<AppData[]>([])
    const { toast } = useToast()

    React.useEffect(() => {
        fetchRegions().then(data => setRegions([{ name: 'No region selected', language: '', countryCode: '' }, ...data]))
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: "" },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const urls = filterValidUrls(values.text)
        if (urls.length === 0) {
            toast({ title: "No valid URLs found", description: "Please enter valid URLs." })
            return
        }

        const data = await submitUrls(urls, value)
        if (Array.isArray(data)) {
            setAppDataList(data)
            toast({ title: "Success", description: "In-app data fetched successfully." })
        }
    }

    const exportToCSV = () => {
        const csvData = appDataList.flatMap(app =>
            app.data.map(d => ({
                Name: app.name,
                Country: app.country.name,
                Language: app.country.language,
                "Country Code": app.country.countryCode,
                "Plan Title": d.title,
                Price: d.price,
            }))
        )

        const worksheet = XLSX.utils.json_to_sheet(csvData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "AppData")

        const csvOutput = XLSX.write(workbook, { bookType: "csv", type: "string" })
        const utf8Output = "\uFEFF" + csvOutput  // Add BOM for UTF-8 encoding

        const blob = new Blob([utf8Output], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "AppData.csv"
        link.click()
    }

    const exportToExcel = () => {
        const excelData = appDataList.flatMap(app =>
            app.data.map(d => ({
                Name: app.name,
                Country: app.country.name,
                Language: app.country.language,
                "Country Code": app.country.countryCode,
                "Plan Title": d.title,
                Price: d.price,
            }))
        )

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "AppData")
        XLSX.writeFile(workbook, "AppData.xlsx")
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50 text-left">
                    <div className="space-y-2 text-left">
                        <FormLabel className="text-gray-700">Region</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between px-4 py-2 text-sm border border-gray-200 rounded-md bg-white shadow-sm"
                                >
                                    {value ? regions.find(region => region.countryCode === value)?.name : "Select region..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 rounded-md shadow-lg border border-gray-200 bg-white">
                                <Command>
                                    <CommandInput placeholder="Search region..." className="p-2 border-b border-gray-200" />
                                    <CommandList>
                                        {regions.length === 0 ? (
                                            <CommandEmpty>No region found.</CommandEmpty>
                                        ) : (
                                            <CommandGroup>
                                                {regions.map((region, index) => (
                                                    <CommandItem
                                                        key={`${region.countryCode}-${index}`}
                                                        value={region.countryCode}
                                                        onSelect={(currentValue) => {
                                                            setValue(currentValue === value ? "" : currentValue)
                                                            setOpen(false)
                                                        }}
                                                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 text-blue-500",
                                                                value === region.countryCode ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {`${region.name} - ${region.countryCode}`}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700">Text</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Enter your text here..." {...field} className="w-full h-48 px-4 py-2 border border-gray-200 rounded-md bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit</Button>
                </form>
            </Form>

            <div className="flex justify-center space-x-4 mt-8">
                <Button
                    onClick={exportToCSV}
                    className="bg-green-500 text-white"
                    disabled={appDataList.length === 0} // Vô hiệu hóa khi không có data
                >
                    Export to CSV
                </Button>
                <Button
                    onClick={exportToExcel}
                    className="bg-blue-500 text-white"
                    disabled={appDataList.length === 0} // Vô hiệu hóa khi không có data
                >
                    Export to Excel
                </Button>
                <PDFDownloadLink
                    document={<PDFDocument appDataList={appDataList} />}
                    fileName="AppData.pdf"
                    className={`${appDataList.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <Button className="bg-purple-500 text-white" disabled={appDataList.length === 0}>Download PDF</Button>
                </PDFDownloadLink>
            </div>


            {appDataList.map((appData, index) => (
                <AppDataComponent key={index} appData={appData} />
            ))}
        </div>
    )
}
