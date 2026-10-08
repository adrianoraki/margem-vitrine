// Tipos do banco do Margem, no formato do `supabase gen types typescript`.
// Gerado das migrations em supabase/migrations. Não edite à mão:
// com o projeto criado, regenere com `pnpm --filter @margem/core gen:types`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  core: {
    Tables: {
      assinaturas: {
        Row: {
          organizacao_id: string;
          plano: Database['core']['Enums']['plano'];
          status: Database['core']['Enums']['status_assinatura'];
          teste_ate: string | null;
          gateway_cliente_id: string | null;
          atualizado_em: string;
        };
        Insert: {
          organizacao_id: string;
          plano?: Database['core']['Enums']['plano'];
          status?: Database['core']['Enums']['status_assinatura'];
          teste_ate?: string | null;
          gateway_cliente_id?: string | null;
          atualizado_em?: string;
        };
        Update: {
          organizacao_id?: string;
          plano?: Database['core']['Enums']['plano'];
          status?: Database['core']['Enums']['status_assinatura'];
          teste_ate?: string | null;
          gateway_cliente_id?: string | null;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      dispositivos_push: {
        Row: {
          id: string;
          organizacao_id: string;
          user_id: string;
          plataforma: string;
          endpoint: string;
          chaves: Json | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          user_id: string;
          plataforma: string;
          endpoint: string;
          chaves?: Json | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          user_id?: string;
          plataforma?: string;
          endpoint?: string;
          chaves?: Json | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      limites_taxa: {
        Row: {
          chave: string;
          janela: string;
          contagem: number;
        };
        Insert: {
          chave: string;
          janela: string;
          contagem?: number;
        };
        Update: {
          chave?: string;
          janela?: string;
          contagem?: number;
        };
        Relationships: [];
      };
      log_jobs: {
        Row: {
          id: number;
          job: string;
          iniciado_em: string;
          terminado_em: string | null;
          status: string;
          detalhes: Json;
        };
        Insert: {
          id?: never;
          job: string;
          iniciado_em?: string;
          terminado_em?: string | null;
          status?: string;
          detalhes?: Json;
        };
        Update: {
          id?: never;
          job?: string;
          iniciado_em?: string;
          terminado_em?: string | null;
          status?: string;
          detalhes?: Json;
        };
        Relationships: [];
      };
      membros: {
        Row: {
          organizacao_id: string;
          user_id: string;
          papel: Database['core']['Enums']['papel'];
          criado_em: string;
        };
        Insert: {
          organizacao_id: string;
          user_id: string;
          papel?: Database['core']['Enums']['papel'];
          criado_em?: string;
        };
        Update: {
          organizacao_id?: string;
          user_id?: string;
          papel?: Database['core']['Enums']['papel'];
          criado_em?: string;
        };
        Relationships: [];
      };
      notificacoes: {
        Row: {
          id: string;
          organizacao_id: string;
          user_id: string;
          tipo: string;
          titulo: string;
          corpo: string | null;
          link: string | null;
          lida_em: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          user_id: string;
          tipo: string;
          titulo: string;
          corpo?: string | null;
          link?: string | null;
          lida_em?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          user_id?: string;
          tipo?: string;
          titulo?: string;
          corpo?: string | null;
          link?: string | null;
          lida_em?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      organizacoes: {
        Row: {
          id: string;
          cnpj: string | null;
          razao_social: string;
          nome_fantasia: string | null;
          cnae_principal: string | null;
          uf: string | null;
          municipio: string | null;
          criado_em: string;
          exclusao_solicitada_em: string | null;
        };
        Insert: {
          id?: string;
          cnpj?: string | null;
          razao_social: string;
          nome_fantasia?: string | null;
          cnae_principal?: string | null;
          uf?: string | null;
          municipio?: string | null;
          criado_em?: string;
          exclusao_solicitada_em?: string | null;
        };
        Update: {
          id?: string;
          cnpj?: string | null;
          razao_social?: string;
          nome_fantasia?: string | null;
          cnae_principal?: string | null;
          uf?: string | null;
          municipio?: string | null;
          criado_em?: string;
          exclusao_solicitada_em?: string | null;
        };
        Relationships: [];
      };
      solicitacoes_titular: {
        Row: {
          id: string;
          organizacao_id: string;
          tipo: string;
          solicitado_por: string | null;
          solicitado_em: string;
          concluido_em: string | null;
          detalhes: Json;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          tipo: string;
          solicitado_por?: string | null;
          solicitado_em?: string;
          concluido_em?: string | null;
          detalhes?: Json;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          tipo?: string;
          solicitado_por?: string | null;
          solicitado_em?: string;
          concluido_em?: string | null;
          detalhes?: Json;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consumir_limite: {
        Args: { p_chave: string; p_limite: number; p_janela_segundos: number };
        Returns: boolean;
      };
      criar_organizacao: {
        Args: {
          p_cnpj: string;
          p_razao_social: string;
          p_nome_fantasia?: string;
          p_cnae_principal?: string;
          p_uf?: string;
          p_municipio?: string;
        };
        Returns: string;
      };
      eh_dono: { Args: { p_organizacao: string }; Returns: boolean };
      eh_membro: { Args: { p_organizacao: string }; Returns: boolean };
      solicitar_exclusao: { Args: { p_organizacao: string }; Returns: string };
    };
    Enums: {
      papel: 'dono' | 'membro';
      plano: 'free' | 'licita_pro' | 'compras_pro' | 'completo';
      status_assinatura: 'teste' | 'ativa' | 'inadimplente' | 'cancelada';
    };
    CompositeTypes: { [_ in never]: never };
  };
  licita: {
    Tables: {
      catalogo_termos: {
        Row: {
          id: number;
          termo: string;
          categoria: string;
          ativo: boolean;
        };
        Insert: {
          id?: never;
          termo: string;
          categoria: string;
          ativo?: boolean;
        };
        Update: {
          id?: never;
          termo?: string;
          categoria?: string;
          ativo?: boolean;
        };
        Relationships: [];
      };
      contratacoes: {
        Row: {
          numero_controle_pncp: string;
          orgao_cnpj: string;
          orgao_razao_social: string;
          ano_compra: number;
          sequencial_compra: number;
          numero_compra: string | null;
          processo: string | null;
          unidade_nome: string | null;
          uf: string;
          municipio: string | null;
          codigo_ibge: string | null;
          modalidade_id: number;
          modalidade_nome: string | null;
          objeto: string;
          valor_total_estimado: number | null;
          valor_total_homologado: number | null;
          situacao_id: number | null;
          situacao_nome: string | null;
          data_publicacao: string | null;
          data_abertura_proposta: string | null;
          data_encerramento_proposta: string | null;
          link_sistema_origem: string | null;
          termos_casados: string[];
          coletado_em: string;
          atualizado_em: string;
        };
        Insert: {
          numero_controle_pncp: string;
          orgao_cnpj: string;
          orgao_razao_social: string;
          ano_compra: number;
          sequencial_compra: number;
          numero_compra?: string | null;
          processo?: string | null;
          unidade_nome?: string | null;
          uf: string;
          municipio?: string | null;
          codigo_ibge?: string | null;
          modalidade_id: number;
          modalidade_nome?: string | null;
          objeto: string;
          valor_total_estimado?: number | null;
          valor_total_homologado?: number | null;
          situacao_id?: number | null;
          situacao_nome?: string | null;
          data_publicacao?: string | null;
          data_abertura_proposta?: string | null;
          data_encerramento_proposta?: string | null;
          link_sistema_origem?: string | null;
          termos_casados?: string[];
          coletado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          numero_controle_pncp?: string;
          orgao_cnpj?: string;
          orgao_razao_social?: string;
          ano_compra?: number;
          sequencial_compra?: number;
          numero_compra?: string | null;
          processo?: string | null;
          unidade_nome?: string | null;
          uf?: string;
          municipio?: string | null;
          codigo_ibge?: string | null;
          modalidade_id?: number;
          modalidade_nome?: string | null;
          objeto?: string;
          valor_total_estimado?: number | null;
          valor_total_homologado?: number | null;
          situacao_id?: number | null;
          situacao_nome?: string | null;
          data_publicacao?: string | null;
          data_abertura_proposta?: string | null;
          data_encerramento_proposta?: string | null;
          link_sistema_origem?: string | null;
          termos_casados?: string[];
          coletado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      funil: {
        Row: {
          id: string;
          organizacao_id: string;
          numero_controle_pncp: string;
          estagio: Database['licita']['Enums']['estagio_funil'];
          nota: string | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          numero_controle_pncp: string;
          estagio?: Database['licita']['Enums']['estagio_funil'];
          nota?: string | null;
          criado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          numero_controle_pncp?: string;
          estagio?: Database['licita']['Enums']['estagio_funil'];
          nota?: string | null;
          criado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      itens: {
        Row: {
          numero_controle_pncp: string;
          numero_item: number;
          descricao: string;
          material_ou_servico: string | null;
          quantidade: number | null;
          unidade_medida: string | null;
          valor_unitario_estimado: number | null;
          valor_total: number | null;
          situacao_id: number | null;
          tem_resultado: boolean;
          termos_casados: string[];
          atualizado_em: string;
        };
        Insert: {
          numero_controle_pncp: string;
          numero_item: number;
          descricao: string;
          material_ou_servico?: string | null;
          quantidade?: number | null;
          unidade_medida?: string | null;
          valor_unitario_estimado?: number | null;
          valor_total?: number | null;
          situacao_id?: number | null;
          tem_resultado?: boolean;
          termos_casados?: string[];
          atualizado_em?: string;
        };
        Update: {
          numero_controle_pncp?: string;
          numero_item?: number;
          descricao?: string;
          material_ou_servico?: string | null;
          quantidade?: number | null;
          unidade_medida?: string | null;
          valor_unitario_estimado?: number | null;
          valor_total?: number | null;
          situacao_id?: number | null;
          tem_resultado?: boolean;
          termos_casados?: string[];
          atualizado_em?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          organizacao_id: string;
          numero_controle_pncp: string;
          regra_id: string;
          termos: string[];
          criado_em: string;
          notificado_em: string | null;
        };
        Insert: {
          organizacao_id: string;
          numero_controle_pncp: string;
          regra_id: string;
          termos?: string[];
          criado_em?: string;
          notificado_em?: string | null;
        };
        Update: {
          organizacao_id?: string;
          numero_controle_pncp?: string;
          regra_id?: string;
          termos?: string[];
          criado_em?: string;
          notificado_em?: string | null;
        };
        Relationships: [];
      };
      regras_radar: {
        Row: {
          id: string;
          organizacao_id: string;
          nome: string;
          termos: string[];
          ufs: string[];
          municipios: string[];
          modalidades: number[];
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          nome?: string;
          termos?: string[];
          ufs?: string[];
          municipios?: string[];
          modalidades?: number[];
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          nome?: string;
          termos?: string[];
          ufs?: string[];
          municipios?: string[];
          modalidades?: number[];
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      resultados: {
        Row: {
          numero_controle_pncp: string;
          numero_item: number;
          sequencial_resultado: number;
          fornecedor_documento: string | null;
          fornecedor_nome: string | null;
          tipo_pessoa: string | null;
          quantidade_homologada: number | null;
          valor_unitario_homologado: number | null;
          valor_total_homologado: number | null;
          data_resultado: string | null;
          atualizado_em: string;
        };
        Insert: {
          numero_controle_pncp: string;
          numero_item: number;
          sequencial_resultado: number;
          fornecedor_documento?: string | null;
          fornecedor_nome?: string | null;
          tipo_pessoa?: string | null;
          quantidade_homologada?: number | null;
          valor_unitario_homologado?: number | null;
          valor_total_homologado?: number | null;
          data_resultado?: string | null;
          atualizado_em?: string;
        };
        Update: {
          numero_controle_pncp?: string;
          numero_item?: number;
          sequencial_resultado?: number;
          fornecedor_documento?: string | null;
          fornecedor_nome?: string | null;
          tipo_pessoa?: string | null;
          quantidade_homologada?: number | null;
          valor_unitario_homologado?: number | null;
          valor_total_homologado?: number | null;
          data_resultado?: string | null;
          atualizado_em?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      estagio_funil: 'interesse' | 'proposta_enviada' | 'ganhou' | 'perdeu';
    };
    CompositeTypes: { [_ in never]: never };
  };
  compras: {
    Tables: {
      acessos_certificado: {
        Row: {
          id: number;
          certificado_id: string | null;
          organizacao_id: string;
          acao: string;
          por: string;
          em: string;
        };
        Insert: {
          id?: never;
          certificado_id?: string | null;
          organizacao_id: string;
          acao: string;
          por: string;
          em?: string;
        };
        Update: {
          id?: never;
          certificado_id?: string | null;
          organizacao_id?: string;
          acao?: string;
          por?: string;
          em?: string;
        };
        Relationships: [];
      };
      certificados: {
        Row: {
          id: string;
          organizacao_id: string;
          cnpj: string;
          titular_nome: string;
          tipo: string;
          valido_de: string;
          valido_ate: string;
          pfx_secret_id: string | null;
          senha_secret_id: string | null;
          enviado_por: string | null;
          criado_em: string;
          revogado_em: string | null;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          cnpj: string;
          titular_nome: string;
          tipo: string;
          valido_de: string;
          valido_ate: string;
          pfx_secret_id?: string | null;
          senha_secret_id?: string | null;
          enviado_por?: string | null;
          criado_em?: string;
          revogado_em?: string | null;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          cnpj?: string;
          titular_nome?: string;
          tipo?: string;
          valido_de?: string;
          valido_ate?: string;
          pfx_secret_id?: string | null;
          senha_secret_id?: string | null;
          enviado_por?: string | null;
          criado_em?: string;
          revogado_em?: string | null;
        };
        Relationships: [];
      };
      fornecedores: {
        Row: {
          id: string;
          organizacao_id: string;
          documento: string | null;
          nome: string;
          uf: string | null;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          documento?: string | null;
          nome: string;
          uf?: string | null;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          documento?: string | null;
          nome?: string;
          uf?: string | null;
        };
        Relationships: [];
      };
      itens_compra: {
        Row: {
          id: string;
          organizacao_id: string;
          nota_id: string;
          produto_id: string | null;
          numero_item: number;
          descricao: string;
          ean: string | null;
          ncm: string | null;
          cfop: string | null;
          quantidade: number;
          unidade: string;
          valor_unitario: number;
          valor_total: number;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          nota_id: string;
          produto_id?: string | null;
          numero_item: number;
          descricao: string;
          ean?: string | null;
          ncm?: string | null;
          cfop?: string | null;
          quantidade: number;
          unidade: string;
          valor_unitario: number;
          valor_total: number;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          nota_id?: string;
          produto_id?: string | null;
          numero_item?: number;
          descricao?: string;
          ean?: string | null;
          ncm?: string | null;
          cfop?: string | null;
          quantidade?: number;
          unidade?: string;
          valor_unitario?: number;
          valor_total?: number;
        };
        Relationships: [];
      };
      notas: {
        Row: {
          id: string;
          organizacao_id: string;
          chave: string;
          numero: string | null;
          serie: string | null;
          emitida_em: string;
          fornecedor_id: string | null;
          valor_total: number;
          destinatario_nome: string | null;
          destinatario_documento: string | null;
          destinatario_email: string | null;
          xml_storage_path: string | null;
          origem: string;
          importada_em: string;
          anonimizada_em: string | null;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          chave: string;
          numero?: string | null;
          serie?: string | null;
          emitida_em: string;
          fornecedor_id?: string | null;
          valor_total: number;
          destinatario_nome?: string | null;
          destinatario_documento?: string | null;
          destinatario_email?: string | null;
          xml_storage_path?: string | null;
          origem: string;
          importada_em?: string;
          anonimizada_em?: string | null;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          chave?: string;
          numero?: string | null;
          serie?: string | null;
          emitida_em?: string;
          fornecedor_id?: string | null;
          valor_total?: number;
          destinatario_nome?: string | null;
          destinatario_documento?: string | null;
          destinatario_email?: string | null;
          xml_storage_path?: string | null;
          origem?: string;
          importada_em?: string;
          anonimizada_em?: string | null;
        };
        Relationships: [];
      };
      produtos: {
        Row: {
          id: string;
          organizacao_id: string;
          nome: string;
          ean: string | null;
          ncm: string | null;
          categoria: string | null;
          unidade_base: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          nome: string;
          ean?: string | null;
          ncm?: string | null;
          categoria?: string | null;
          unidade_base?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          nome?: string;
          ean?: string | null;
          ncm?: string | null;
          categoria?: string | null;
          unidade_base?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      sync_dfe: {
        Row: {
          organizacao_id: string;
          cnpj: string;
          ultimo_nsu: number;
          max_nsu: number | null;
          ultima_consulta_em: string | null;
          proxima_consulta_apos: string | null;
          status: string;
          mensagem: string | null;
        };
        Insert: {
          organizacao_id: string;
          cnpj: string;
          ultimo_nsu?: number;
          max_nsu?: number | null;
          ultima_consulta_em?: string | null;
          proxima_consulta_apos?: string | null;
          status?: string;
          mensagem?: string | null;
        };
        Update: {
          organizacao_id?: string;
          cnpj?: string;
          ultimo_nsu?: number;
          max_nsu?: number | null;
          ultima_consulta_em?: string | null;
          proxima_consulta_apos?: string | null;
          status?: string;
          mensagem?: string | null;
        };
        Relationships: [];
      };
      vinculos_licitacao: {
        Row: {
          id: string;
          organizacao_id: string;
          produto_id: string;
          descricao_normalizada: string;
          unidade_licitacao: string | null;
          fator_conversao: number;
          confirmado_por: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          organizacao_id: string;
          produto_id: string;
          descricao_normalizada: string;
          unidade_licitacao?: string | null;
          fator_conversao?: number;
          confirmado_por?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          organizacao_id?: string;
          produto_id?: string;
          descricao_normalizada?: string;
          unidade_licitacao?: string | null;
          fator_conversao?: number;
          confirmado_por?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      custos_produtos: {
        Args: { p_organizacao: string; p_dias?: number };
        Returns: {
          produto_id: string;
          nome: string;
          unidade: string;
          compras: number;
          quantidade: number;
          custo_medio: number;
          custo_minimo: number;
          custo_maximo: number;
          ultimo_custo: number;
          ultima_compra: string;
        }[];
      };
      importar_nota: {
        Args: { p_organizacao: string; p_nota: Json };
        Returns: Json;
      };
      ler_certificado: {
        Args: { p_certificado: string; p_por: string };
        Returns: { pfx_base64: string; senha: string }[];
      };
      revogar_certificado: { Args: { p_certificado: string }; Returns: undefined };
      salvar_certificado: {
        Args: {
          p_organizacao: string;
          p_cnpj: string;
          p_titular: string;
          p_tipo: string;
          p_valido_de: string;
          p_valido_ate: string;
          p_pfx_base64: string;
          p_senha: string;
          p_enviado_por: string;
        };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
