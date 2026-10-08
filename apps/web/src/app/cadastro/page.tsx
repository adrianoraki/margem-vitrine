import { redirect } from 'next/navigation';

// Links antigos para /cadastro: o login sem senha já cria a conta.
export default function Cadastro() {
  redirect('/entrar');
}
