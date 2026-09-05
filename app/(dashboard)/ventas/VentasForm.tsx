'use client'

import { useState } from 'react'
import { createSaleAction } from '@/app/lib/ventas/actions/sales'
import { Plus, Trash2 } from 'lucide-react'

interface Product {
    id: string;
    name: string;
    salePrice: number;
    stock: number;
}

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
}

interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    discount: number;
    unitPrice: number;
    subtotal: number;
}

export default function VentasForm({ customers, products, userId }: { customers: Customer[], products: Product[], userId: string }) {
    const [items, setItems] = useState<SaleItem[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '')
    const [quantity, setQuantity] = useState(1)

    const addItem = () => {
        const product = products.find(p => p.id === selectedProduct)
        if (!product || quantity <= 0) return

        const currentCartQuantity = items
            .filter(item => item.productId === product.id)
            .reduce((sum, item) => sum + item.quantity, 0)

        if (currentCartQuantity + quantity > product.stock){
            alert(`No hay suficiente stock. Disponible: ${product.stock}, En carrito: ${currentCartQuantity}`)
            return
        }
        
    
        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            discount: 0,
            unitPrice: product.salePrice,
            subtotal: product.salePrice * quantity
        }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleSubmit = async (formData: FormData) => {
        const customerId = formData.get('customerId') as string
        const total = items.reduce((sum, item) => sum + item.subtotal, 0)
        
        await createSaleAction({
            customerId,
            userId,
            items,
            subtotal: total,
            discount: 0,
            tax: 0,
            total,
            paymentMethod: 'EFECTIVO'
        })
        setItems([])
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <label className="block text-xs font-medium text-slate-300">Cliente</label>
                <select name="customerId" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                    {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select onChange={(e) => setSelectedProduct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                    </select>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} min="1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                    <button type="button" onClick={addItem} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>
            </div>

            {items.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <table className="w-full text-white text-sm">
                        <thead>
                            <tr className="text-slate-400">
                                <th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-t border-slate-800">
                                    <td className="py-2">{item.productName}</td>
                                    <td className="py-2">{item.quantity}</td>
                                    <td className="py-2">RD${item.unitPrice}</td>
                                    <td className="py-2">RD${item.subtotal}</td>
                                    <td className="py-2"><button type="button" onClick={() => removeItem(index)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 pt-4 border-t border-slate-800 font-bold text-lg">
                        Total: RD${items.reduce((sum, item) => sum + item.subtotal, 0)}
                    </div>
                </div>
            )}

            <button type="submit" disabled={items.length === 0 }  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Finalizar Venta
            </button>
        </form>
    )
}
