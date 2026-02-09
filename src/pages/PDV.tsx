import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, Search, Loader2, PackagePlus, Edit, MoreVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { AddProductModal } from '@/components/dashboard/AddProductModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Product = Database['public']['Tables']['products']['Row'];

export function PDV() {
    const { products, loading, refetch } = useProducts();
    const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (product.stock_quantity !== null && existing.quantity < product.stock_quantity) {
                setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            }
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item;
                if (item.product.stock_quantity !== null && newQty > item.product.stock_quantity) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    const handleCheckout = async () => {
        setProcessing(true);
        try {
            // 1. Create Transaction
            const { error: transError } = await supabase
                .from('transactions')
                .insert({
                    type: 'income',
                    category: 'PDV Sale',
                    amount: total,
                    status: 'paid',
                    due_date: new Date().toISOString()
                } as unknown as any)
                .select()
                .single();

            if (transError) throw transError;

            // 2. Decrement Stock (Simplified loop)
            for (const item of cart) {
                if (item.product.stock_quantity !== null) {
                    await supabase
                        .from('products')
                        // @ts-ignore
                        .update({ stock_quantity: item.product.stock_quantity! - item.quantity })
                        .eq('id', item.product.id);
                }
            }

            alert(`Venda finalizada! Transação criada.`);
            setCart([]);
            refetch(); // Update stock in UI
        } catch (err: any) {
            console.error(err);
            alert('Erro ao processar venda: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            refetch();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            alert('Erro ao excluir produto: ' + error.message);
        }
    };

    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsAddProductModalOpen(true);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 h-[calc(100vh-100px)] animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Left Panel - Products */}
            <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar produtos..."
                            className="pl-9 bg-zinc-900 border-zinc-800 text-white focus-visible:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        setProductToEdit(null);
                        setIsAddProductModalOpen(true);
                    }}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Cadastrar Produto
                    </Button>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 flex-1">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className="bg-zinc-900 border-zinc-800 hover:border-primary/50 transition-all group flex flex-col overflow-hidden relative"
                            >
                                <div
                                    className="aspect-square bg-zinc-800 w-full relative overflow-hidden cursor-pointer"
                                    onClick={() => addToCart(product)}
                                >
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                            <ShoppingCart className="h-10 w-10 opacity-20" />
                                        </div>
                                    )}

                                    {product.stock_quantity !== null && product.stock_quantity < 5 && (
                                        <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                                            Baixo Estoque: {product.stock_quantity}
                                        </Badge>
                                    )}
                                </div>

                                {/* Action Menu */}
                                <div className="absolute top-2 right-2 z-20">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                            <DropdownMenuItem onClick={() => handleEditProduct(product)} className="hover:bg-zinc-800 cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="hover:bg-zinc-800 cursor-pointer text-red-500 hover:text-red-400">
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <CardContent className="p-3" onClick={() => addToCart(product)}>
                                    <h3 className="font-semibold text-white truncate cursor-pointer hover:text-primary transition-colors">{product.name}</h3>
                                    <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{product.stock_quantity || 0} em estoque</p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col h-full">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Carrinho
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p>Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                <div className="flex-1">
                                    <p className="font-medium text-white">{item.product.name}</p>
                                    <p className="text-sm text-primary">{formatCurrency(item.product.price)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center space-x-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={() => removeFromCart(item.product.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-white">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <Button size="lg" className="w-full text-lg h-12" disabled={cart.length === 0 || processing} onClick={handleCheckout}>
                        {processing ? 'Processando...' : 'Finalizar Venda'}
                    </Button>
                </div>
            </div>

            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => {
                    setIsAddProductModalOpen(false);
                    setProductToEdit(null);
                }}
                onSuccess={() => {
                    refetch();
                    setIsAddProductModalOpen(false);
                    setProductToEdit(null);
                }}
                productToEdit={productToEdit}
            />
        </div>
    );
}
