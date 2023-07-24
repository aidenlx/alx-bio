import { join } from "../deps.ts";

// const url = "http://purl.obolibrary.org/obo/hp/hpoa/hp.json";

interface HPOData {
  id: string;
  name: string;
}

interface Graph {
  id: string;
  meta: {
    basicPropertyValues: {
      pred: string;
      val: string;
    }[];
    version: string;
  };
  nodes: {
    id: string;
    lbl: string;
    type: string;
    meta: {
      xrefs: {
        val: string;
      }[];
      basicPropertyValues: {
        pred: string;
        val: string;
      }[];
    };
  }[];
  edges: {
    sub: string;
    pred: string;
    obj: string;
  }[];
  propertyChainAxioms: {
    predicateId: string;
    chainPredicateIds: string[];
  }[];
}

interface HpJson {
  graphs: Graph[];
}

export default async function getHPOData(res: string) {
  const data: HpJson = await Deno.readTextFile(join(res, "hp.json")).then(
    JSON.parse
  );
  return Object.fromEntries(
    data.graphs[0].nodes.map((n) => [
      n.id,
      { name: n.lbl, id: n.id } satisfies HPOData,
    ])
  );
}
